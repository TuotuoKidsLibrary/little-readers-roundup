# Member profile customization

## Build
- Add profile photo, tagline, and introduction fields to signed-in member profiles.
- Let members upload or replace an image with file type and size validation.
- Save the new profile details with the member account and show the photo in the account area and header avatar.
- Add English and Chinese labels, hints, success messages, and character limits.

## Technical details
- Store tagline, introduction, and profile-photo URL in authenticated user metadata so they persist without changing existing book data.
- Reuse the existing image storage flow and account edit controls.
- Verify the profile editing flow, mobile layout, and current build diagnostics.
