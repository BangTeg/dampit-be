'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reservations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Reservations.hasMany(models.Vehicles, {
        foreignKey: 'vehicleId',
        as: 'vehicle'
      })
      Reservations.hasMany(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      })
    }
  }
  Reservations.init({
    userId: DataTypes.INTEGER,
    vehicleId: DataTypes.INTEGER,
    pickUp: DataTypes.STRING,
    dropOff: DataTypes.STRING,
    passengers: DataTypes.INTEGER,
    institution: DataTypes.ENUM('personal', 'company', 'organization', 'others'),
    unit: DataTypes.INTEGER,
    pickDate: DataTypes.DATE,
    dropDate: DataTypes.DATE,
    status: DataTypes.ENUM('pending', 'approved', 'rejected', 'finished', 'cancelled'),
    finishedAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Reservations',
  });
  return Reservations;
};