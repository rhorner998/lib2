const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth'); //
// const { searchGoogleBooks } = require('./routes/api'); // 

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findById(context.user._id).populate('savedBooks');
      }
      throw new AuthenticationError('You must be logged in!');
    },
    users: async () => {
      return await User.find().populate('savedBooks');
    },
    user: async (parent, { username }) => {
      return await User.findOne({ username }).populate('savedBooks');
    },
    books: async () => {
      return await Book.find();
    },
    book: async (parent, { title }) => {
      return await Book.findOne({ title });
    },
    // // New resolver for searching books
    // searchBooks: async (parent, { searchInput }, context) => {
    //   if (!context.user) {
    //     throw new AuthenticationError('You must be logged in to search books!');
    //   }
      
    //   try {
    //     const { items } = await searchGoogleBooks(searchInput); // Ensure this call matches the expected signature
    //     return items.map(book => ({
    //       bookId: book.id,
    //       authors: book.volumeInfo.authors || ['No author to display'],
    //       title: book.volumeInfo.title,
    //       description: book.volumeInfo.description,
    //       image: book.volumeInfo.imageLinks?.thumbnail || '',
    //       link: book.volumeInfo.infoLink
    //     }));
    //   } catch (error) {
    //     console.error('Error searching books:', error);
    //     throw new Error('Error searching for books');
    //   }
    // },  
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('No user found with this email');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect password');
      }
      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
