'use strict';

const fs = require('fs');
const pg = require('pg');
const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
const conString = 'postgres://postgres:1234@localhost:5432/kilovolt';

// Mac:
// const conString = 'postgres://localhost:5432';

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins so that our app can parse the request body
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources
app.get('/new-article', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js, if any, is interacting with this particular piece of `server.js`? What part of CRUD, if any, is being enacted/managed by this particular piece of code?
  // This is number 5 on the diagram and also 1 since it is sending the user to the /new page. This is not not creating a new article, but sending the user to the new article page so it does not interact with article.js This is the 'Read' part of CRUD.
  response.sendFile('new.html', {root: './public'});
});


// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // 3 because on client.query the controller is interacting with the model (SQL). This is interacting with Article.fetchAll() in article.js. This corresponds with the 'Read' portion of CRUD.
  let SQL = 'SELECT * FROM articles';
  client.query(SQL)
    .then(function(result) {
      response.send(result.rows);
    })
    .catch(function(err) {
      console.error(err)
    })
});

app.post('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // I would say this corresponds with number 2 and number 3 because the variable SQL being declared is passed in as an argument within client.query(), but is created with the request by the user. This corresponds with the 'Create' portion of CRUD and interacts with Article.insertRecord().
  let SQL = `
    INSERT INTO articles(title, author, author_url, category, published_on, body)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body
  ]

  client.query( SQL, values )
    .then(function() {
      response.send('insert complete')
    })
    .catch(function(err) {
      console.error(err);
    });
});

app.put('/articles/:id', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This involves number 3 because the variable is being passed in as an argument for the controller's query to the model. This corresponds with Article.updateRecord() method and the 'Update' portion of CRUD.

  let SQL = `UPDATE articles SET title = $1, author = $2, author_url = $3, category = $4, published_on = $5, body = $6 WHERE article_id = $7;`;
  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body,
    request.params.id,
  ];

  client.query( SQL, values )
    .then(() => {
      response.send('update complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles/:id', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This involves number 3 because the variable is being passed in as an argument for the controller's query to the model. This corresponds with the Article.delete() method and the 'Delete' portion of CRUD.

  let SQL = `DELETE FROM articles WHERE article_id=$1;`;
  let values = [request.params.id];

  client.query( SQL, values )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This involves number 3 because the variable is being passed in as an argument for the controller's query to the model. This corresponds with the Article.truncateTable() method and the 'Delete' portion of CRUD.

  let SQL = 'TRUNCATE TABLE articles';
  client.query( SQL )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

// COMMENT: What is this function invocation doing?
// This function creates a data table in SQL with all of the proper columns and specifications if it doesn't exist already. Then, it runs the loadArticles() function if there are no errors.
loadDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Again, number 3 because the variable is being passed in as an argument in client.query(). This interacts with the Article.fetchAll() method since it will populate the articles page with the articles when the user's get request is granted. Related to the 'Read' portion of CRUD.

  let SQL = 'SELECT COUNT(*) FROM articles';
  client.query( SQL )
    .then(result => {
    // REVIEW: result.rows is an array of objects that PostgreSQL returns as a response to a query.
    // If there is nothing on the table, then result.rows[0] will be undefined, which will make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
    // Therefore, if there is nothing on the table, line 158 will evaluate to true and enter into the code block.
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data/hackerIpsum.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO articles(title, author, author_url, category, published_on, body)
              VALUES ($1, $2, $3, $4, $5, $6);
            `;
            let values = [ele.title, ele.author, ele.author_url, ele.category, ele.published_on, ele.body];
            client.query( SQL, values );
          })
        })
      }
    })
}

function loadDB() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Number 3 because it is the controller querying the model. It is associated with Article.loadAll() and the 'Read' portion of CRUD.
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      author_url VARCHAR (255),
      category VARCHAR(20),
      published_on DATE,
      body TEXT NOT NULL);`
  )
    .then(() => {
      loadArticles();
    })
    .catch(err => {
      console.error(err);
    });
}
