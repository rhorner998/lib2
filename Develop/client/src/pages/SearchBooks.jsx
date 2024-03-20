import React, { useState, useEffect } from 'react';
import { Container, Col, Form, Button, Card, Row, Alert } from 'react-bootstrap';
import { useLazyQuery, useMutation } from '@apollo/client';

import Auth from '../utils/auth';
import { SEARCH_BOOKS } from '../queries';
import { SAVE_BOOK } from '../mutations';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  const [executeSearch, { data, loading, error }] = useLazyQuery(SEARCH_BOOKS);
  const [saveBookMutation] = useMutation(SAVE_BOOK);

  useEffect(() => {
    if (data) {
      const bookData = data.searchBooks.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
    }
  }, [data]);

  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!searchInput) {
      return false;
    }

    executeSearch({ variables: { searchInput } });
    setSearchInput('');
  };

  const handleSaveBook = async (bookId) => {
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await saveBookMutation({
        variables: { bookData: { ...bookToSave } },
        update: cache => {
          cache.modify({
            fields: {
              savedBooks: existingBooks => [...existingBooks, bookToSave]
            }
          });
        }
      });

      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Container>
        <h1>Search for Books!</h1>
        <Form onSubmit={handleFormSubmit}>
          <Row>
            <Col xs={12} md={8}>
              <Form.Control
                name='searchInput'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type='text'
                size='lg'
                placeholder='Search for a book'
              />
            </Col>
            <Col xs={12} md={4}>
              <Button type='submit' variant='success' size='lg'>
                Submit Search
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
      <Container>
        <h2>
          {loading ? 'Searching books...' : searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : 'Search for a book to begin'}
        </h2>
        <Row>
          {error && <Alert variant="danger">An error occurred: {error.message}</Alert>}
          {searchedBooks.map((book) => (
            <Col key={book.bookId} xs={12} md={4} lg={3}>
              <Card>
                <Card.Img variant="top" src={book.image} alt={`The cover for ${book.title}`} />
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    disabled={savedBookIds.includes(book.bookId)}
                    onClick={() => handleSaveBook(book.bookId)}>
                    {savedBookIds.includes(book.bookId) ? 'Saved' : 'Save'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
