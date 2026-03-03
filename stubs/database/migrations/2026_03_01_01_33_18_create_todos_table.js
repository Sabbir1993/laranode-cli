const Schema = use('laranode/Database/Schema/Schema');

module.exports = {
    /**
     * Run the migrations.
     */
    async up() {
        await Schema.create('todos', (table) => {
            table.id();
            table.integer('user_id');
            table.string('title');
            table.text('description').nullable();
            table.boolean('is_completed').default(false);
            table.string('file_path').nullable();
            table.timestamps();
        });
    },

    /**
     * Reverse the migrations.
     */
    async down() {
        await Schema.dropIfExists('todos');
    }
};
