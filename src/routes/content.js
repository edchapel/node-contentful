import _ from 'lodash';
import express from 'express';
import { createClient } from 'contentful';
import { markdown } from 'markdown';

const getClient = () => createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: process.env.CONTENTFUL_SPACE_KEY,
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: process.env.CONTENTFUL_API_KEY
  });

const router = express.Router();

router.get('/', (req, res, next) => {
  const client = getClient();

  client.getEntries()
    .then(response => {
      const entries = _(response.items)
        .filter(x => x.sys.contentType.sys.id === process.env.POST_TYPE_ID)
        .map(x => ({
          title: x.fields.title,
          url: `./post/${x.fields.slug}`,
        }))
        .value();
      res.render('entries', {
        items: response.items,
        entries
      });
    })
    .catch(next);
});

router.get('/post/:slug', (req, res, next) => {
  const client = getClient();

    client.getEntries({
        'content_type': process.env.POST_TYPE_ID,
        'fields.slug': req.params.slug,
      })
      .then(response => {
        if (!response.items || response.items.length != 1) {
          return res.redirect('../');
        }

        const fields = response.items[0].fields;
        const entry = {
          title: fields.title,
          body : markdown.toHTML(fields.body),
          author: fields.author[0].fields.name,
        };
        if (fields.featuredImage) {
          const image = fields.featuredImage.fields;
          entry.featuredImage = {
            alt: image.title,
            url: image.file.url,
            width: image.file.details.width,
            height: image.file.details.height,
          };
        }
        res.render('post', entry);
      })
      .catch(next);
});

module.exports = router;
