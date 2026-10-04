# Vercel entry for the existing Komarev badge

This directory provides a dependency-free Vercel relay for `diaoenmao`'s existing
Komarev badge. The original PHP project remains in the repository root.

Import this fork into Vercel, choose **Other**, and use the repository root as the Root
Directory. Leave build/output settings at their defaults. No database, credentials,
or environment variables are needed. The badge is served at `/api/views` or `/ghpvc/`.

Komarev continues to store the existing total (last verified as 6,651 on 2026-10-05).
There is no new counter and no `base` offset, so history is not reset or doubled.
GitHub Camo's user agent is forwarded for GitHub image requests; ordinary browser
previews request the upstream without an incrementing Camo user agent.

This is a relay, not a self-hosted PHP counter. It still depends on the availability
of Komarev. On an upstream failure it returns HTTP 503 and `--`, never a invented
number. Run `npm test` to check forwarding, preserved history, and failure handling.
