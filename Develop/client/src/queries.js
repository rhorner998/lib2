import { gql } from '@apollo/client';

export const GET_ME = gql`
  query me {
    me {
      _id
      username
      email
      savedBooks {
        bookId
        authors
        description
        title
        image
        link
      }
    }
  }
`;

// 
export const SEARCH_BOOKS = gql`
  query searchBooks($searchInput: String!) {
    searchBooks(searchInput: $searchInput) {
      bookId
      authors
      description
      title
      image
      link
    }
  }
`;
