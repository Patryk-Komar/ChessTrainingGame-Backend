export default class User {

    constructor(
        private username: string,
        private email: string,
        private password: string,
        private firstName: string,
        private lastName: string) {
    }

    private validateUsername(): boolean {
        const usernameRegex = new RegExp(/^[A-Za-z][a-zA-Z0-9.-_]{2,14}$/);
        return usernameRegex.test(this.username);
    }

    private validateEmail(): boolean {
        const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        return emailRegex.test(this.email);
    }

    private validatePassword(): boolean {
        const passwordRegex = new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/);
        return passwordRegex.test(this.password);
    }

    private validateFirstName(): boolean {
        const firstsNameRegex = new RegExp(/^[A-ZŁŻ][a-ząćęłńóśżź]{2,24}$/);
        return firstsNameRegex.test(this.firstName);
    }

    private validateLastName(): boolean {
        const lastNameRegex = new RegExp(/^[A-ZĆŁŚŻ][a-ząćęłńóśżź]{2,24}$/);
        return lastNameRegex.test(this.lastName);
    }

    public validate(): boolean {
        return (this.validateUsername() && this.validateEmail() && this.validatePassword()
            && this.validateFirstName() && this.validateLastName());
    }

}