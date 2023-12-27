'use strict';
const {
  Model
} = require('sequelize');

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
    id: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
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
    isVerified: DataTypes.ENUM('yes', 'no'),
    verificationToken: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};