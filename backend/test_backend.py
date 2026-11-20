"""Run with python -m unittest discover -s backend. Uses an isolated database."""

import os
import tempfile
import unittest
from unittest.mock import patch

import httpx
from sqlalchemy.exc import OperationalError

temporary_database = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + temporary_database.name.replace("\\", "/") + "/test.db"
os.environ["SEED_DEMO_DATA"] = "false"
os.environ["ENABLE_TEST_ACCOUNT"] = "true"

from database import engine
from main import app


class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.lifespan = app.router.lifespan_context(app)
        await self.lifespan.__aenter__()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.lifespan.__aexit__(None, None, None)

    async def test_database_failure_returns_redacted_503(self):
        with patch("sqlalchemy.orm.Session.execute", side_effect=OperationalError("secret", {}, Exception("password"))):
            response = await self.client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "Database unavailable"})

    async def test_guideline_submission_review_and_bootstrap(self):
        await self.client.post("/api/auth/login", json={"identifier": "ashwik@topper", "password": "klarity"})
        health = await self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertFalse(health.json()["demo_data"])
        response = await self.client.post("/api/guidelines", json={
            "title": "Voice", "category": "tone", "content": "Use clear language", "priority": 2,
        })
        self.assertEqual(response.status_code, 201, response.text)
        guideline_id = response.json()["id"]
        response = await self.client.patch(f"/api/guidelines/{guideline_id}", json={"priority": 3})
        self.assertEqual(response.json()["priority"], 3)
        response = await self.client.post("/api/submissions", json={
            "title": "Launch", "content_type": "text", "content_text": "Welcome to Klarity.", "submitted_by": "Tester",
        })
        self.assertEqual(response.status_code, 201, response.text)
        submission_id = response.json()["id"]
        self.assertEqual(len(response.json()["reports"]), 1)
        response = await self.client.post(f"/api/submissions/{submission_id}/action", json={
            "action": "approved", "performed_by": "Reviewer", "comment": "Ready",
        })
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["status"], "approved")
        response = await self.client.get("/api/bootstrap")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertFalse(response.json()["demo_data"])
        self.assertEqual(response.json()["submissions"][0]["status"], "approved")
        response = await self.client.delete(f"/api/guidelines/{guideline_id}")
        self.assertEqual(response.status_code, 204, response.text)

    async def test_authentication_and_logout(self):
        response = await self.client.get("/api/bootstrap")
        self.assertEqual(response.status_code, 401)
        response = await self.client.post("/api/auth/login", json={"identifier": "ashwik@topper", "password": "wrong"})
        self.assertEqual(response.status_code, 401)
        response = await self.client.post("/api/auth/login", json={"identifier": "ashwik@topper", "password": "klarity"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "ashwik")
        self.assertIn("token", response.json())
        bearer_token = response.json()["token"]
        self.assertNotIn("password_hash", response.json())
        self.assertIn("HttpOnly", response.headers["set-cookie"])
        token = self.client.cookies.get("klarity_session")
        self.assertEqual((await self.client.get("/api/auth/me")).status_code, 200)

        # Verify Bearer token works without cookies
        self.client.cookies.clear()
        res_bearer = await self.client.get("/api/bootstrap", headers={"Authorization": f"Bearer {bearer_token}"})
        self.assertEqual(res_bearer.status_code, 200)

        self.assertEqual((await self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {bearer_token}"})).status_code, 204)
        self.assertEqual((await self.client.get("/api/bootstrap")).status_code, 401)
        self.client.cookies.set("klarity_session", token)
        self.assertEqual((await self.client.get("/api/auth/me")).status_code, 401)

    async def test_registration_and_username_login(self):
        payload = {"username": "newuser", "email": "newuser@gmail.com", "password": "new-password", "role": "admin"}
        response = await self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        login_res = await self.client.post("/api/auth/login", json={"identifier": "newuser", "password": payload["password"]})
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual((await self.client.get("/api/bootstrap")).status_code, 200)
        response = await self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 409)
        await self.client.post("/api/auth/logout")
        response = await self.client.post("/api/auth/login", json={"identifier": "NEWUSER", "password": payload["password"]})
        self.assertEqual(response.status_code, 200)
        response = await self.client.post("/api/auth/logout", headers={"Origin": "https://evil.example"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual((await self.client.get("/api/auth/me")).status_code, 200)


class SecurityBotProtectionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.lifespan = app.router.lifespan_context(app)
        await self.lifespan.__aenter__()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.lifespan.__aexit__(None, None, None)

    async def test_robots_txt_served(self):
        res = await self.client.get("/robots.txt")
        self.assertEqual(res.status_code, 200)
        self.assertIn("User-agent: *", res.text)
        self.assertIn("Disallow: /api/", res.text)

    async def test_malicious_scanner_user_agent_blocked(self):
        res = await self.client.get("/api/health", headers={"User-Agent": "sqlmap/1.6.4#stable (https://sqlmap.org)"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("automated vulnerability scanner", res.json()["detail"].lower())

        res2 = await self.client.get("/api/health", headers={"User-Agent": "Mozilla/5.0 (compatible; Nikto/2.1.6)"})
        self.assertEqual(res2.status_code, 403)

    async def test_exploit_probe_paths_rejected(self):
        res = await self.client.get("/.env")
        self.assertEqual(res.status_code, 404)

        res2 = await self.client.get("/wp-login.php")
        self.assertEqual(res2.status_code, 404)

    async def test_payload_size_enforcement(self):
        huge_size = str(20 * 1024 * 1024)
        res = await self.client.post("/api/auth/login", headers={"Content-Length": huge_size}, json={})
        self.assertEqual(res.status_code, 413)
        self.assertIn("Payload too large", res.json()["detail"])

    async def test_rate_limit_headers_on_valid_request(self):
        res = await self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("X-RateLimit-Limit", res.headers)
        self.assertIn("X-RateLimit-Remaining", res.headers)
        self.assertEqual(res.headers.get("Server"), "Klarity-Gateway")

    async def test_admin_registration_with_custom_brand_and_clean_workspace(self):
        reg = await self.client.post("/api/auth/register", json={
            "username": "acme_lead",
            "email": "lead@acme.corp",
            "password": "securepassword123",
            "role": "owner",
            "brand_name": "Acme Innovations",
            "brand_values": "Pioneering, bold, reliable",
            "clean_workspace": True,
        })
        self.assertEqual(reg.status_code, 201)
        data = reg.json()
        self.assertTrue(data["is_approved"])
        self.assertEqual(data["account"]["brand_name"], "Acme Innovations")
        self.assertTrue(data["account"]["brand_code"].startswith("ACME"))

        # Verify brand appears in public list_brands
        brands_res = await self.client.get("/api/auth/brands")
        brand_names = [b["brand_name"] for b in brands_res.json()["brands"]]
        self.assertIn("Acme Innovations", brand_names)

        # Login and verify workspace settings
        login_res = await self.client.post("/api/auth/login", json={
            "identifier": "lead@acme.corp",
            "password": "securepassword123",
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.json()["brand_name"], "Acme Innovations")

        # Verify bootstrap returns clean state (zero guidelines, zero submissions, zero stats)
        bootstrap_res = await self.client.get("/api/bootstrap")
        self.assertEqual(bootstrap_res.status_code, 200)
        boot_data = bootstrap_res.json()
        self.assertEqual(boot_data["stats"]["total_submissions"], 0)
        self.assertEqual(boot_data["stats"]["active_guidelines"], 0)
        self.assertEqual(len(boot_data["guidelines"]), 0)
        self.assertEqual(len(boot_data["submissions"]), 0)
        self.assertEqual(len(boot_data["activity"]), 0)
        self.assertFalse(boot_data["demo_data"])

        # Verify brand directory contains ONLY their own brand
        dir_res = await self.client.get("/api/auth/brand-directory")
        self.assertEqual(dir_res.status_code, 200)
        dir_brands = dir_res.json()["brands"]
        self.assertEqual(len(dir_brands), 1)
        self.assertEqual(dir_brands[0]["brand_name"], "Acme Innovations")

        # Create a guideline for Acme Innovations
        create_res = await self.client.post("/api/guidelines", json={
            "title": "Acme Tone",
            "category": "tone",
            "content": "Always innovate with precision.",
            "priority": 3,
        })
        self.assertEqual(create_res.status_code, 201)

        # Verify bootstrap now has Acme guideline
        acme_boot = await self.client.get("/api/bootstrap")
        self.assertEqual(len(acme_boot.json()["guidelines"]), 1)
        self.assertEqual(acme_boot.json()["guidelines"][0]["title"], "Acme Tone")

        # Verify demo user ashwik continues to have multi-brand directory and isolated data
        demo_login = await self.client.post("/api/auth/login", json={
            "identifier": "ashwik",
            "password": "klarity",
        })
        self.assertEqual(demo_login.status_code, 200)
        self.assertTrue(demo_login.json()["is_demo"])

        demo_dir = await self.client.get("/api/auth/brand-directory")
        self.assertEqual(demo_dir.status_code, 200)
        self.assertGreater(len(demo_dir.json()["brands"]), 1)

        demo_boot = await self.client.get("/api/bootstrap")
        self.assertEqual(demo_boot.status_code, 200)
        ashwik_guidelines = [g["title"] for g in demo_boot.json()["guidelines"]]
        self.assertNotIn("Acme Tone", ashwik_guidelines)


def tearDownModule():
    engine.dispose()
    temporary_database.cleanup()
