exports.up = function (knex) {
  return knex.schema.createTable('projects', (table) => {
    table.increments('id').primary(); // Auto-incrementing project ID
    table.string('creator').notNullable(); // Creator's identifier
    table.string('name').notNullable(); // Project title
    table.string('url'); // Project URL
    table.boolean('hosted').defaultTo(false); // Whether the project is hosted
    table.jsonb('allPledges').defaultTo(knex.raw("'[]'::jsonb")); // Proper JSON default
    table.string('selectedPledge').defaultTo(knex.raw("'[]'::jsonb"));
    table.decimal('latePledgePrice', 10, 2);
    table.decimal('price', 10, 2);
    table.jsonb('files').defaultTo(knex.raw("'[]'::jsonb")); // Proper JSON default
    table.string('thumbnail');
    table.jsonb('tags').defaultTo(knex.raw("'[]'::jsonb"));
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Auto timestamp
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('projects');
};
