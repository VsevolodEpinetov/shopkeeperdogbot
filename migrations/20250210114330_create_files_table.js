exports.up = function (knex) {
  return knex.schema.createTable('files', (table) => {
    table.string('groupbuyID').references('telegramGroupID').inTable('groupbuys').onDelete('CASCADE');
    table.string('filesID').primary();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('files');
};
