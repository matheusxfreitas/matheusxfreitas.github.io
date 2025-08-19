// js/firebase-config.js
// Este arquivo contém apenas a configuração do Firebase.
// As variáveis 'app' e 'db' ficam disponíveis globalmente para os outros scripts.

const firebaseConfig = {
    apiKey: "AIzaSyA050ckDIuD1ujjyRee81r0Vv_jygoHs1Q",
    authDomain: "meu-painel-de-estudos-v2.firebaseapp.com",
    projectId: "meu-painel-de-estudos-v2",
    storageBucket: "meu-painel-de-estudos-v2.firebasestorage.app",
    messagingSenderId: "889152606734",
    appId: "1:889152606734:web:09457849b695f3f1d4625f"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
