class Event {
    constructor(command) {
        this.commandDefinition = command;
        this.expression = '* * * * *'; // Default to every minute
    }

    /**
     * Define the custom cron expression
     * @param {string} expression 
     */
    cron(expression) {
        this.expression = expression;
        return this;
    }

    everyMinute() {
        return this.cron('* * * * *');
    }

    hourly() {
        return this.cron('0 * * * *');
    }

    daily() {
        return this.cron('0 0 * * *');
    }

    weekly() {
        return this.cron('0 0 * * 0');
    }

    weeklyOn(day, time = '0:0') {
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} * * ${day}`);
    }

    monthly() {
        return this.cron('0 0 1 * *');
    }

    /** Expressive Modifiers **/

    everyTwoMinutes() { return this.cron('*/2 * * * *'); }
    everyThreeMinutes() { return this.cron('*/3 * * * *'); }
    everyFourMinutes() { return this.cron('*/4 * * * *'); }
    everyFiveMinutes() { return this.cron('*/5 * * * *'); }
    everyTenMinutes() { return this.cron('*/10 * * * *'); }
    everyFifteenMinutes() { return this.cron('*/15 * * * *'); }
    everyThirtyMinutes() { return this.cron('0,30 * * * *'); }

    everyTwoHours() { return this.cron('0 */2 * * *'); }
    everyThreeHours() { return this.cron('0 */3 * * *'); }
    everyFourHours() { return this.cron('0 */4 * * *'); }
    everySixHours() { return this.cron('0 */6 * * *'); }

    dailyAt(time) {
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} * * *`);
    }

    twiceDaily(first = 1, second = 13) {
        return this.cron(`0 ${first},${second} * * *`);
    }

    twiceDailyAt(first = 1, second = 13, min = 0) {
        return this.cron(`${min} ${first},${second} * * *`);
    }

    weekdays() {
        return this.cron('0 0 * * 1-5');
    }

    weekends() {
        return this.cron('0 0 * * 0,6');
    }

    mondays() { return this.cron('0 0 * * 1'); }
    tuesdays() { return this.cron('0 0 * * 2'); }
    wednesdays() { return this.cron('0 0 * * 3'); }
    thursdays() { return this.cron('0 0 * * 4'); }
    fridays() { return this.cron('0 0 * * 5'); }
    saturdays() { return this.cron('0 0 * * 6'); }
    sundays() { return this.cron('0 0 * * 0'); }

    monthlyOn(day = 1, time = '0:0') {
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} ${day} * *`);
    }

    twiceMonthly(first = 1, second = 16, time = '0:0') {
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} ${first},${second} * *`);
    }

    lastDayOfMonth(time = '0:0') {
        // Technically pure cron doesn't support "L", we'll just fake it as the 28-31th in isDue for real logic later or 
        // use an approximated basic pattern
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} L * *`);
    }

    yearly() {
        return this.cron('0 0 1 1 *');
    }

    yearlyOn(month = 1, day = 1, time = '0:0') {
        const [hour, min] = time.split(':');
        return this.cron(`${min} ${hour} ${day} ${month} *`);
    }

    /**
     * Check if the event is due to run
     * @param {Date} date Current date
     * @returns {boolean}
     */
    isDue(date = new Date()) {
        const parts = this.expression.split(' ');
        if (parts.length < 5) return false;

        const currentParts = [
            date.getMinutes(),
            date.getHours(),
            date.getDate(),
            date.getMonth() + 1, // JS months are 0-11
            date.getDay()
        ];

        return currentParts.every((val, index) => {
            if (parts[index] === '*') return true;

            // Handle last day of month "L"
            if (index === 2 && parts[index] === 'L') {
                const nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);
                return nextDay.getMonth() !== date.getMonth(); // It's the last day if tomorrow is a new month
            }

            if (parts[index].includes(',')) {
                return parts[index].split(',').map(Number).includes(val);
            }
            if (parts[index].includes('-')) {
                const [start, end] = parts[index].split('-').map(Number);
                return val >= start && val <= end;
            }
            if (parts[index].includes('/')) {
                const step = Number(parts[index].split('/')[1]);
                return val % step === 0;
            }
            return Number(parts[index]) === val;
        });
    }

    getCommand() {
        return this.commandDefinition;
    }
}

module.exports = Event;
