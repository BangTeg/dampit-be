'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Vehicles extends Model {
    static associate(models) {
      Vehicles.hasMany(models.Reservations, {
        foreignKey: 'vehicleId',
        as: 'Reservations',
      });
    }
  }
  
  Vehicles.init({
    name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    model: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    include: DataTypes.STRING,
    area: DataTypes.STRING,
    parking: DataTypes.STRING,
    payment: DataTypes.STRING,
    overtime: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Vehicles',
  });
  return Vehicles;
};