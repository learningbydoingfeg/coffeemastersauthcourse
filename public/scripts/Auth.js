import API from "./API.js";
import Router from "./Router.js";

const Auth = {
    isLoggedIn: false,
    account: null,
    postLogin: (response, user) => {
        if (response.ok) {
            Auth.isLoggedIn = true;
            Auth.account = user;
            Auth.updateStatus()
            Router.go('/account');
        } else {
            alert(response.message);
        }
        // credential management API storage
        if (window.PasswordCredential && user.password) {
            const credentials = new PasswordCredential({
                id: user.email,
                password: user.password,
                name: user.name
            })
            navigator.credentials.store(credentials)
        }
    },
    loginFromGoogle: async (data) => {
        const response = await API.loginFromGoogle({ credential: data })
        Auth.postLogin(response, {
            name: response.name, email: response.email
        })
    },
    register: async (event) => {
        event.preventDefault()
        const user = {
            name: document.getElementById("register_name").value,
            email: document.getElementById("register_email").value,
            password: document.getElementById("register_password").value,
        }

        const response = await API.register(user)
        Auth.postLogin(response, user)
    },
    checkAuthOptions: async () => {
        const response = await API.checkAuthOptions({
            email: document.getElementById("login_email").value
        })
        Auth.loginStep = 2;
        if (response.password) {
            document.getElementById("login_section_password").hidden = false;
        }

        if (response.webauthn) {
            document.getElementById("login_section_webauthn").hidden = false;
        }
    },
    addWebAuthn: async () => {
        const options = await API.webAuthn.registrationOptions();
        console.log(options) // options does seems like an object with th challenge but cannot pass from here
        const authRes = await SimpleWebAuthnBrowser.startRegistration(options);

        // here im getting issues 
        //
        const verificationRes = await API.webAuthn.registrationVerification(authRes)
        if (verificationRes.ok) {
            alert('you can now login with webauthn!')
        } else {
            alert(verificationRes.message)
        }
    },
    login: async (event) => {
        if (event) event.preventDefault()

        if (Auth.loginStep === 1) {
            Auth.checkAuthOptions();
        } else {
            // step 2
            const credentials = {
                email: document.getElementById("login_email").value,
                password: document.getElementById("login_password").value,
            }

            const response = await API.login(credentials)
            Auth.postLogin(response, {
                ...credentials,
                name: response.name
            })
        }
    },
    autoLogin: async () => {
        if (window.PasswordCredential) {
            const credentials = await navigator.credentials.get({ password: true })
            if (credentials) {
                document.getElementById("login_email").value = credentials.id
                document.getElementById("login_password").value = credentials.password
                Auth.login()
            }

        }

    },
    logOut: () => {
        Auth.isLoggedIn = false;
        Auth.account = null;
        Auth.updateStatus();
        Router.go('/');
        if (window.PasswordCredential) {
            navigator.credentials.preventSilentAccess()
        }
    },
    updateStatus() {
        if (Auth.isLoggedIn && Auth.account) {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "none"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".account_name").forEach(
                e => e.innerHTML = Auth.account.name
            );
            document.querySelectorAll(".account_username").forEach(
                e => e.innerHTML = Auth.account.email
            );

        } else {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "none"
            );

        }
    },
    loginStep: 1,
    init: () => {
        document.getElementById("login_section_password").hidden = true
        document.getElementById("login_section_webauthn").hidden = true
    },
}
Auth.updateStatus();
Auth.autoLogin()

export default Auth;

// make it a global object
window.Auth = Auth;
