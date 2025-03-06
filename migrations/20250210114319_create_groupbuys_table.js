exports.up = function (knex) {
  return knex.schema.createTable('groupbuys', (table) => {
    table.string('telegramGroupID').primary();
    table.jsonb('messagesID').defaultTo(knex.raw("'[]'::jsonb"));
    table.integer('projectID').references('id').inTable('projects').onDelete('CASCADE'); // Safer relation
    table.decimal('margin', 10, 2);
    table.decimal('minPricePerMember', 10, 2);
    table.decimal('pricePerMember', 10, 2);
    table.decimal('finalPrice', 10, 2);
    table.string('status');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('groupbuys');
};
