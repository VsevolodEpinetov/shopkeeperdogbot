exports.up = function (knex) {
  return knex.schema.createTable('groupbuy_participants', (table) => {
    table.increments('id').primary();
    table.string('telegramGroupID').unsigned().notNullable().references('telegramGroupID').inTable('groupbuys').onDelete('CASCADE');
    table.string('telegramID').unsigned().notNullable().references('telegramID').inTable('users').onDelete('CASCADE');
    table.boolean('paid').defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('groupbuy_participants');
};
