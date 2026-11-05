# SWIT QB Companion – releases

The signed releases of **SWIT QB Companion**, for online updates. The code itself is in a private repository; only the release zips and the signed update notices are kept here.

- **`channels/stable.json`, `channels/beta.json`:** the latest release of each channel, signed with SWIT's update key. Each SWIT QB Companion server checks these once a day, and tells its Admin when there is something new. Nothing is installed until the Admin presses **Install update**.
- **Releases:** each one carries the zip `SWITQBCompanion_WindowsApp_<version>.zip`. A release marked *pre-release* goes to **beta** only. A full release goes to **beta** and **stable**.
- **The GitHub Action** (`.github/workflows/publish.yml`) makes and signs the notice when a release is published, with the private key in the repository secret **UPDATE_KEY**. To make an earlier release the stable one, use **Actions → Publish update → Run workflow** (version, channel *stable*).

A server only installs a zip whose notice is signed by SWIT and whose checksum matches.
