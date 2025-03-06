exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.string('telegramID').primary();
    table.string('telegramUsername');
    table.string('telegramFirstName');
    table.string('telegramLastName');
    table.timestamp('addedAt').defaultTo(knex.fn.now());
    table.timestamp('lastSeenAt').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
