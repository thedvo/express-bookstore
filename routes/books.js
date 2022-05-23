const express = require('express');
const Book = require('../models/book');
const ExpressError = require('../expressError');

const router = new express.Router();

const { validate } = require('jsonschema');
const bookSchema = require('../schemas/bookSchema.json');
const bookSchemaUpdate = require('../schemas/bookSchemaUpdate.json');

/** GET / => {books: [book, ...]}  */

router.get('/', async function (req, res, next) {
	try {
		const books = await Book.findAll(req.query);
		return res.json({ books });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  => {book: book} */

router.get('/:id', async function (req, res, next) {
	try {
		const book = await Book.findOne(req.params.id);
		return res.json({ book });
	} catch (err) {
		return next(err);
	}
});

/** POST /   bookData => {book: newBook}  */

router.post('/', async function (req, res, next) {
	try {
		// first validate req.body against our book schema
		const validation = validate(req.body, bookSchema);

		// if result does not conform to the schema, throw an error
		if (!validation.valid) {
			const listOfErrors = validation.errors.map((e) => e.stack);
			const error = new ExpressError(listOfErrors, 400);

			return next(error);
		}
		// otherwise, if everyting is valid, create the book and return
		const book = await Book.create(req.body);
		return res.status(201).json({ book });
	} catch (err) {
		return next(err);
	}
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put('/:isbn', async function (req, res, next) {
	try {
		// req.body should not contain isbn since we are updating the book entry.
		// Refer to the book model to see the format of the schema
		if ('isbn' in req.body) {
			return next({
				status: 400,
				message: 'Not allowed',
			});
		}

		// continue to validate req.body against our bookSchemaUpdate schema
		const validation = validate(req.body, bookSchemaUpdate);
		if (!validation.valid) {
			const listOfErrors = validation.errors.map((e) => e.stack);
			const error = new ExpressError(listOfErrors, 400);

			return next(error);
		}

		const book = await Book.update(req.params.isbn, req.body);
		return res.json({ book });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete('/:isbn', async function (req, res, next) {
	try {
		await Book.remove(req.params.isbn);
		return res.json({ message: 'Book deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
