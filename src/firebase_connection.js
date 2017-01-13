function FireBaseConnection() {
    fc = this;
    var config = {
        apiKey: "AIzaSyDCVdeKfPoJbT_RxfzOOJ-RtibZZsei_NY",
        authDomain: "fir-test-88d4d.firebaseapp.com",
        databaseURL: "https://fir-test-88d4d.firebaseio.com",
        storageBucket: "fir-test-88d4d.appspot.com",
        messagingSenderId: "217039909483"
    };
    firebase.initializeApp(config);
    //riferimento al db
    this.rootRef = firebase.database().ref();

    //effettua il login, i parametri in input sono email e password dell'utente.
    this.login = function (email, password, data) {
        firebase.auth().signInWithEmailAndPassword(email, password)
                .then(
                        function (firebaseUser) {
                            //alert("Login effettuato!");
                            fc.add_data_db(firebase.auth().currentUser.uid, data)
                        })
                .catch(
                        function (error) {
                            var errorCode = error.code;
                            var errorMessage = error.message;

                            if (errorCode === "auth/wrong-password")
                                alert("Password errata!");
                            else if (errorCode === "auth/invalid-email")
                                alert("Email errata!");
                            else if (errorCode === "auth/user-disabled")
                                alert("Utente disabilitato!");
                            else if (errorCode === "auth/user-not-found")
                                alert("Utente non trovato!");
                            else
                                alert(errorMessage);
                        });
        return firebase.auth().currentUser;
    };



    this.add_data_db = function (uid, object) {
        var userRef = this.rootRef.child(uid)
        userRef.child("canzone3").set(object, function () {});
        alert("Aggiunto al db!");
    };

    this.logout = function () {
        firebase.auth().signOut().then(
                function () {
                    alert("Arrivederci!");
                },
                function (error) {
                    alert(error);
                }
        );
    };

    this.create_account = function (email, password) {
        firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(
                        function (firebaseUser) {
                            alert("Account creato!");
                        })
                .catch(function (error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;

                    if (errorCode === "auth/weak-password") {
                        alert("Password troppo debole!");
                    } else if (errorCode === "auth/operation-not-allowed") {
                        alert("Email/password non abilitati");
                    } else if (errorCode === "auth/invalid-email") {
                        alert("Email non valida!");
                    } else if (errorCode === "auth/email-already-in-use") {
                        alert("L'email già esiste!");
                    } else {
                        alert(errorMessage);
                    }
                    console.log(error);
                });

    };

    this.return_all_data = function (uid) {
        firebase.database().ref(uid).orderByKey().on("child_added", function (data) {
            r.restoreData(data.exportVal())
        });

    };
}
;