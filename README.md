# AudienceKit website

Jekyll source for [audiencekit.com](https://audiencekit.com/).

The website presents AudienceKit and its Focus (Admin / Platform), Velvet
(Venues), and Backstage (Performers / People) apps. Featured audience preview
content lives in `_data/featured_audiences.yml`.

## Local development

With Ruby 3.3 or newer:

```sh
bundle install
bundle exec jekyll serve
```

Build with `JEKYLL_ENV=production bundle exec jekyll build --strict_front_matter`.
Pushing to `main` publishes through the existing GitHub Pages workflow.

## Staff app links

`/apps/focus/`, `/apps/velvet/` and `/apps/backstage/` are the stable links for QR codes and posters: phones go straight to TestFlight (iPhone/iPad) or Google Play (Android), desktops see both buttons, and `?stay` shows the page on a phone. The store URLs live in `_data/staff_apps.yml`; change them there when an app leaves beta and printed codes keep working. `python3 scripts/qr.py` regenerates `assets/qr/*.svg` after adding an app.
