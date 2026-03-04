const Job = use('laranode/Queue/Job');

class ExampleJob extends Job {
    constructor(data) {
        super(data);
    }

    async handle() {
        console.log('Executing ExampleJob with data:', this.data);
        // Simulate work by sleeping for 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('ExampleJob completed successfully!');
    }
}

module.exports = ExampleJob;
