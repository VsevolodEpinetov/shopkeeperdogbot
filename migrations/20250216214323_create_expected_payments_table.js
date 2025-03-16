exports.up = function (knex) {
  return knex.schema.createTable('expected_payments', (table) => {
    table.increments('id').primary();
    table.string('telegramGroupID').unsigned().notNullable().references('telegramGroupID').inTable('groupbuys').onDelete('CASCADE');
    table.string('telegramID').unsigned().notNullable().references('telegramID').inTable('users').onDelete('CASCADE');
    table.string('amount').notNullable();
    table.string('payment_method').defaultTo('PayPal').notNullable();
    table.boolean('completed').defaultTo(false).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('expected_payments');
};
