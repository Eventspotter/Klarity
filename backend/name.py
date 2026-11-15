"""Alias module so uvicorn name:app works identically to uvicorn main:app."""
from main import app  # noqa: F401
