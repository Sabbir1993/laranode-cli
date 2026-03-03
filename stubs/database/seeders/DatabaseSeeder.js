const Seeder = use('laranode/Database/Seeder');

class DatabaseSeeder extends Seeder {
    async run() {
        console.log('Database seeded from DatabaseSeeder!');
    }
}

module.exports = DatabaseSeeder;
