'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.review.belongsTo(models.album)
    }
  }
  review.init({
    song: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    albumId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'review',
  });
  return review;
};