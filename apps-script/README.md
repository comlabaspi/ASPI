# Serve student websites from Google Drive

The student cards currently link to Drive folders. Drive's HTML preview displays HTML source rather than running the site. This Apps Script web app serves each student's `index.html` and inlines local CSS, JavaScript, and asset files so relative links can work.

## Deploy

1. Sign in to the Google account that can access all six student project folders.
2. Open [Google Apps Script](https://script.google.com/home/start), create a new project, and replace its `Code.gs` with [`Code.gs`](./Code.gs).
3. Save the project. Choose **Deploy > New deployment**, select **Web app**, set **Execute as** to **Me**, and set **Who has access** to **Anyone**.
4. Authorize the requested Drive access and deploy. Copy the web app URL ending in `/exec`.
5. Test a student site by adding `?folderId=1oZOoKTzFxk-FcZC2aclAcqhRd_ox5G2-` to the URL. The folder must contain `index.html` and any referenced assets.
6. Send the `/exec` URL back so the student cards can be changed from Drive-folder links to live website links.

Anyone with the web app URL can view and run the contents of the six allowlisted project folders. Do not deploy it publicly if those folders contain private files. To add or remove a student project, update `STUDENT_PROJECTS` in `Code.gs`.
