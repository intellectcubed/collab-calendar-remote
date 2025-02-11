const Cookies = {
    set: function(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    },

    get: function(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    },

    delete: function(name) {
        this.set(name, "", -1);
    },

    setObject: function(name, value, days) {
        this.set(name, JSON.stringify(value), days);
    },

    getObject: function(name) {
        const value = this.get(name);
        return value ? JSON.parse(value) : null;
    }
};


// // Usage Examples:
// // Setting individual values
// Cookies.set('userName', 'John', 7);  // Expires in 7 days
// Cookies.set('userAge', '30', 7);

// // Setting object
// Cookies.setObject('userSettings', {
//     theme: 'dark',
//     fontSize: 'large',
//     notifications: true
// }, 30);  // Expires in 30 days

// // Getting values
// const name = Cookies.get('userName');
// const settings = Cookies.getObject('userSettings');

// // Deleting
// Cookies.delete('userName');