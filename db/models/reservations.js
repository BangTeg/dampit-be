'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservations extends Model {
    static associate(models) {
      Reservations.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user',
      });

      Reservations.belongsTo(models.Vehicles, {
        foreignKey: 'vehicleId',
        as: 'vehicle',
      });
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