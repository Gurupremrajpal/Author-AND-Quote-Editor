const express = require("express");
const mysql = require('mysql');
const app = express();
const pool = dbConnection();

app.set("view engine", "ejs");
app.use(express.static("public"));

//Needed to get values from form using POST method
app.use(express.urlencoded({extended:true}));
 

//routes
app.get('/', (req, res) => {
  res.render('index');
});


//Displays form for users to submit author info
app.get('/author/new', (req, res) => {
  res.render('newAuthor');
});


//Stores author info in the database
app.post('/author/new', async (req, res) => {
	let firstName = req.body.fName;
	let lastName = req.body.lName;
	let dateOfBirth = req.body.dob;
  let dateOfDeath =  req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography =  req.body.biography;
  

	let sql = `INSERT INTO q_authors (firstName, lastName, dob, dod, sex, profession, country, portrait, biography) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

	let params = [firstName, lastName, dateOfBirth, dateOfDeath, sex, profession, country, portrait, biography];
	let rows = await executeSQL(sql, params);

  res.redirect('/authors');
});


app.get('/authors', async (req, res) => {
  let sql = "SELECT firstName, lastName, authorId, portrait FROM q_authors ORDER BY lastName";
	let rows = await executeSQL(sql);
	res.render('authorList', {'authors': rows});
});

app.get('/author/edit', async (req, res) => {
	let author_id = req.query.authorId;
  let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO, DATE_FORMAT(dod, '%Y-%m-%d') dodISO FROM q_authors WHERE authorId = ${author_id}`;
	let rows = await executeSQL(sql);
	res.render('editAuthor', {'authorInfo': rows});
});


app.post('/author/edit', async (req, res) => {
	let author_id = req.body.authorId;

	let firstName = req.body.fName;
	let lastName = req.body.lName;
	let dateOfBirth = req.body.dob;
  let dateOfDeath =  req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography =  req.body.biography;

  let sql = `UPDATE q_authors SET firstName = ?, lastName = ?, dob = ?, dod = ?, sex = ?, 
  profession = ?, country = ?, portrait = ?, biography = ? WHERE authorId = ${author_id}`;

	let params = [firstName, lastName, dateOfBirth, dateOfDeath, sex, profession, country, portrait, biography]
	let rows = await executeSQL(sql, params);

	sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO, DATE_FORMAT(dod, '%Y-%m-%d') dodISO FROM q_authors WHERE authorId = ${author_id}`;

	rows = await executeSQL(sql);

	res.render('editAuthor', {'authorInfo': rows, "message": "Author Updated!"});
});

app.get('/author/delete', async (req, res) => {
	let author_id = req.query.authorId;

  let sql = `DELETE FROM q_authors WHERE authorId = ${author_id}`;
	let rows = await executeSQL(sql);

  res.redirect('/authors');
});

//QUOTES:
app.get('/quotes', async (req, res) => {
  let sql = `SELECT quote, authorId, quoteId, firstName, lastName 
						 FROM q_quotes 
						 NATURAL JOIN q_authors`;
	let rows = await executeSQL(sql);
	res.render('quoteList', {'quotes': rows});
});

app.get('/quote/edit', async (req, res) => {
	let quote_id = req.query.quoteId;
  let sql = `SELECT * FROM q_quotes NATURAL JOIN q_authors WHERE quoteId = ?`;
	let params = [quote_id];
	let rows = await executeSQL(sql, params);
  
	let sqlAuthors = `SELECT DISTINCT firstName, lastName, authorId
                    FROM q_authors`;
	let rowsAuthors = await executeSQL(sqlAuthors);

	let sqlCategories = `SELECT DISTINCT category
												FROM q_quotes`;
	let rowsCategories = await executeSQL(sqlCategories);
  
	res.render('editQuote', {'quoteInfo': rows, "authors": rowsAuthors, "categories": rowsCategories});
});

app.post('/quote/edit', async (req, res) => {
  let author_id = req.body.authorId;
	let quote_id = req.body.quoteId;

  let quote = req.body.quote;
  let category = req.body.categories;
  let likes = req.body.likes;

  let sql = `UPDATE q_quotes SET quote = ?, authorId = ?, category = ?, likes = ?
  WHERE quoteId = ?`;

  let params = [quote, author_id, category, likes, quote_id];

	let rows = await executeSQL(sql, params);

	let sqlAuthors = `SELECT DISTINCT firstName, lastName, authorId FROM q_authors`;

	let rowsAuthors = await executeSQL(sqlAuthors);

	let sqlCategories = `SELECT DISTINCT category FROM q_quotes`;

	let rowsCategories = await executeSQL(sqlCategories);

	sql = `SELECT * FROM q_quotes WHERE quoteId = ${quote_id}`;
	rows = await executeSQL(sql);

	res.render('editQuote', {'quoteInfo': rows, "authors": rowsAuthors, "categories": rowsCategories, "message": "Quote Updated"});
});


app.get('/quote/new', async (req, res) => {
  let author_id = req.query.authorId;
	let sqlAuthors = `SELECT DISTINCT firstName, lastName, authorId FROM q_authors`;

	let rowsAuthors = await executeSQL(sqlAuthors);

	let sqlCategories = `SELECT DISTINCT category FROM q_quotes`;
	let rowsCategories = await executeSQL(sqlCategories);

  res.render('newQuote', {"authors": rowsAuthors, "categories": rowsCategories}); 
});


app.post('/quote/new', async (req, res) => {
  let quote = req.body.quote;
  let authorId = req.body.authorId;
  let category = req.body.categories;
  let likes = req.body.likes;
  
  let sql = `INSERT INTO q_quotes(quote, authorId, category, likes) VALUES(?, ?, ?, ?)`;
	let params = [quote, authorId, category, likes];
	let rows = await executeSQL(sql, params);
  
   res.redirect('/quotes'); 
});

app.get('/quote/delete', async (req, res) => {
	let quote_id = req.query.quoteId;

  let sql = `DELETE FROM q_quotes WHERE quoteId = ${quote_id}`;
	let rows = await executeSQL(sql);
  
  res.redirect('/quotes');
});

app.get("/dbTest", async function(req, res){
	let sql = "SELECT CURDATE()";
	let rows = await executeSQL(sql);
	res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params){
return new Promise (function (resolve, reject) {
	pool.query(sql, params, function (err, rows, fields) {
		if (err) throw err;
			resolve(rows);
		});
	});
}//executeSQL
//values in red must be updated
function dbConnection(){

   const pool  = mysql.createPool({

      connectionLimit: 10,
      host: "en1ehf30yom7txe7.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
      user: "ereykugv8x71l19a",
      password: "b07s5nj02g91h4pi",
      database: "lvkilyr9brjlhyjo"

   }); 

   return pool;

}//dbConnection

//start server
app.listen(3000, () => {
	console.log("Expresss server running...")
});