'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vehicles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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