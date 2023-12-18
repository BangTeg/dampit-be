'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');

const { v4: uuidv4 } = require('uuid'); // Import the v4 function from uuid


module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasMany(models.Reservations, {
        foreignKey: 'userId',
        as: 'reservations',
      });
    }
  }
  Users.init({
    username: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.ENUM('admin', 'user'),
    gender: DataTypes.ENUM('male', 'female', 'other'),
    avatar: DataTypes.STRING,
    address: DataTypes.STRING,
    contact: DataTypes.STRING,
    ktp: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};