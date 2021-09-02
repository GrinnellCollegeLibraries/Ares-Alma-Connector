This is a ***beta*** version of an Ex Libris Cloud App that facilitates syncing reserve items between the <a href="https://www.atlas-sys.com/ares">Ares reserves system</a> and <a href="https://exlibrisgroup.com/products/alma-library-services-platform/">Ex Libris Alma</a>. It runs as an <a href="https://developers.exlibrisgroup.com/cloudapps/">Ex Libris Cloud App</a>.

After installation and before the app can be used, a user with the General System Administrator role will need to configure the app by clicking on the three-dot menu and then the wrench icon. The URL of the Ares server and the Ares API key should be entered in the configuration. If you do not have an API key, you can generate one in the Ares Customization Manager. You also need to enter the field in Ares that will link courses in Ares with courses in Alma. This connector depends upon a unique identifier for each course existing both in the specified field in Ares and in the Searchable IDs in Alma. Likely fields for the location of this unique identifier are CourseCode, CourseNumber, ExternalCourseId, or RegistrarCourseId.

The workflow assumes the following:
1. A reserve request already exists in Ares.
2. The course for that reserve request exists in both Ares and Alma.
3. There is a unique identifier for each course that exists both in Ares and in the Searchable IDs in Alma.
4. If you’re using multiple reading lists per course in Alma, all of the reading lists for each course already exist. (If you only use one reading list per course, the cloud app will automatically create that reading list if it doesn’t already exist.)

To use the app:
1. Navigate to the Alma record for the requested item. The most convenient way to do so is likely to be doing a physical item search by barcode and scanning the item.
2. Open the Ares-Alma-Connector Cloud App and enter the ID number for the Ares request.
3. Confirm that the item and course information that appears is correct.
4. If multiple reading lists for the course exist in Alma, choose a reading list.
5. Click "Place on Reserve." This will route the item in Ares to the status "Available at Reserve Desk" and will add it to the course's reading list in Alma.
