# Pick a host

Type: task
Status: open
Blocked by: —

## Question

Decide where this deploys and wire it up, so the iPad home-screen install can actually be tested.

**Why it matters:** iOS only offers Add to Home Screen over `https` or `localhost`. A LAN dev URL like `http://192.168.x.x:3000` will not give the fullscreen standalone chrome, so until this is done, home-screen behaviour is unverified no matter how correct the manifest is.

This is human-in-the-loop — account creation and DNS are not the agent's to do. The agent's side is: recommend a host for a static SPA build, produce the build configuration, and hand over a precise checklist for the parts requiring an account.

Not blocked by anything — takeable at any point. Worth doing **before** [Viewport verification pass](./13-viewport-pass.md) so that pass can include a real installed-app check on the iPad rather than a simulated one in a desktop browser.

Resolution should record: the host, the deploy command, the URL, and any environment configuration a future session would otherwise have to rediscover.
