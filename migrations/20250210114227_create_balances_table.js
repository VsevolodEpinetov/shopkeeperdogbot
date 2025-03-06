exports.up = function (knex) {
  return knex.schema.createTable('balances', (table) => {
    table.string('telegramID').references('telegramID').inTable('users').onDelete('CASCADE');
    table.decimal('current', 10, 2).defaultTo(0);
    table.jsonb('history').defaultTo('[]');
    table.timestamp('lastChangedAt').defaultTo(knex.fn.now());
    table.decimal('totalSpent', 10, 2).defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('balances');
};
