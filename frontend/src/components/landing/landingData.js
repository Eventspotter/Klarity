export const reviewExamples = [
  {
    id: 'launch', name: 'Spring collection', channel: 'Website copy',
    before: 'Meet our revolutionary spring collection. Every piece is 100% eco-friendly, designed to bring a little calm to your everyday.',
    issues: [
      { term: 'revolutionary', title: 'Let the product speak', kind: 'Tone', rule: 'Voice guide §3.1', why: 'Use calm, specific language. Avoid exaggerated superlatives.', fix: 'thoughtfully crafted' },
      { term: '100% eco-friendly', title: 'A claim needs evidence', kind: 'Claim', rule: 'Claims policy §2.4', why: 'An absolute environmental claim is not supported by the approved materials record.', fix: 'made with responsibly sourced materials' },
    ],
  },
  {
    id: 'social', name: 'A little everyday calm', channel: 'Social caption',
    before: 'Elevate your lifestyle with our game-changing homeware. Shop the Aster and Oak collection today.',
    issues: [
      { term: 'game-changing', title: 'Keep the voice grounded', kind: 'Tone', rule: 'Voice guide §3.1', why: 'Describe the everyday benefit instead of using promotional buzzwords.', fix: 'thoughtfully made' },
      { term: 'Aster and Oak', title: 'Use the approved brand name', kind: 'Terminology', rule: 'Naming guide §1.1', why: 'The brand name uses an ampersand across every channel.', fix: 'Aster & Oak' },
    ],
  },
  {
    id: 'email', name: 'The collection is here', channel: 'Launch email',
    before: 'HURRY! Our new collection is guaranteed to transform your home. Discover our hand-finished stoneware, made for slower mornings.',
    issues: [
      { term: 'HURRY!', title: 'Invite, without pressure', kind: 'Tone', rule: 'Voice guide §3.2', why: 'Avoid urgency in all caps. Use an invitation that suits a calm brand voice.', fix: 'Take a moment.' },
      { term: 'is guaranteed to transform', title: 'Be specific about the benefit', kind: 'Claim', rule: 'Claims policy §2.1', why: 'The guarantee promises an outcome that the product record cannot verify.', fix: 'brings thoughtful details to' },
    ],
  },
]

export const contextFiles = [
  { id: 'voice', name: 'Voice & tone.pdf', detail: 'Tone', answer: 'Keep the language calm, specific, and grounded. Avoid “revolutionary” and other exaggerated claims.' },
  { id: 'facts', name: 'Approved claims.md', detail: 'Facts', answer: 'Use only claims supported by the approved materials record. “100% eco-friendly” needs substantiation.' },
  { id: 'names', name: 'Brand terminology.csv', detail: 'Words', answer: 'Write “Aster & Oak” consistently, including the ampersand.' },
  { id: 'assets', name: 'Visual standards.pdf', detail: 'Visuals', answer: 'Check submitted visuals against the approved logo, palette, and typography.' },
]

export const uses = [
  { id: 'copy', tab: 'Campaign copy', ask: 'Does this launch sound like us?', think: ['Compare the draft with the voice guide', 'Find exaggerated or unapproved terms', 'Explain the issue with its guideline', 'Suggest a change that keeps the intent'], result: 'A clearer sentence. Still your voice.', detail: 'Targeted corrections help creators fix the issue without losing the idea behind the work.', icon: 'write' },
  { id: 'claims', tab: 'Facts & claims', ask: 'Can we actually say “100% eco-friendly”?', think: ['Find the claim in the submitted copy', 'Compare it with the approved facts', 'Flag the missing substantiation', 'Suggest supported wording for review'], result: 'Every claim needs something behind it.', detail: 'See the source and the reason for a flag, so you can decide what needs to change.', icon: 'facts' },
  { id: 'visuals', tab: 'Visual identity', ask: 'Is this the approved version of our brand?', think: ['Check the submitted visual asset', 'Compare the logo with approved assets', 'Check brand colors and typography', 'Show deviations for a reviewer to assess'], result: 'The same identity, across every surface.', detail: 'Keep approved logos, colors, and typography beside the content your team creates.', icon: 'visuals' },
  { id: 'review', tab: 'Human review', ask: 'What still needs a reviewer’s attention?', think: ['Collect the issues and suggested fixes', 'Show severity and supporting evidence', 'Keep feedback with the submission', 'Let an authorised reviewer make the call'], result: 'Clear evidence. A human decision.', detail: 'Approve, request changes, or reject with a comment. The final call stays with your team.', icon: 'review' },
]

export const faqs = [
  { q: 'What does Klarity check?', a: 'Klarity checks submitted content against your brand’s guidelines, approved terminology, verified facts, and visual standards. Its review report brings together issue severity, evidence, explanations, and suggested corrections.' },
  { q: 'Does Klarity rewrite our content?', a: 'Suggestions focus on the flagged issue and preserve the creator’s original intent. Creators can revise their work before sending it to a reviewer.' },
  { q: 'Who makes the final decision?', a: 'An authorised human reviewer. Klarity prepares the evidence; reviewers can approve, reject, or request changes and leave a comment with the submission.' },
  { q: 'Is the workspace on this page live?', a: 'The landing-page workspace is an interactive, pre-written demonstration using the fictional Aster & Oak brand. It does not upload files, run an AI model, or publish content. Open the actual workspace to use Klarity’s connected features.' },
]
