This is an ***alpha*** version of an Ex Libris Cloud App that facilitates syncing reserve items between the [Ares reserves system] (https://www.atlas-sys.com/ares) and [Ex Libris Alma] (https://exlibrisgroup.com/products/alma-library-services-platform/).

It runs as an [Ex Libris Cloud App] (https://developers.exlibrisgroup.com/cloudapps/). Since it has not yet been published to the Ex Libris App Center, if you want to try it out you'll need to [use these instructions] (https://developers.exlibrisgroup.com/cloudapps/started/#existing) to run it locally.

After installation, go into settings by clicking on the three-dot menu and then the gear icon. Enter the URL of your Ares server and your Ares API key. If you do not have an API key, you can generate one in the Ares Customization Manager.

The workflow assumes the following:
1. A reserve request already exists in Ares.
2. The course for that reserve request exists in both Ares and Alma.
3. The registrarCourseId field for the course in Ares is populated.
4. The value in the registrarCourseId field in Ares is one of the Searchable IDs for the course in Alma.

To use the app:
1. Navigate to the Alma record for the requested item, preferably by doing a physical item search by barcode and scanning in the item.
2. Open the Ares-Alma-Connector Cloud App and enter the ID number for the Ares request.
3. Confirm that the item and course information that appears is correct.
4. If multiple reading lists for the course exist in Alma, choose a reading list. (***Note that the multiple reading list functionality has not been extensively tested.***)
5. Click "Place on Reserve." This will route the item in Ares to the status "Available at Reserve Desk" and will add it to the course's reading list in Alma.
