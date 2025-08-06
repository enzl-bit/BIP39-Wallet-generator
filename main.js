
let wordlist = [];
let fullWordlist = [];

// Load BIP39 wordlist
fetch('https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt')
  .then(response => response.text())
  .then(text => {
      wordlist = text.split('\n').filter(Boolean);
  });


function toBinary(str) {
    return str.map(word => {
        const index = wordlist.indexOf(word);
        return index.toString(2).padStart(11, '0');
    }).join('');
}

function sha256(buffer) {
    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
        return Array.from(new Uint8Array(hash)).map(b => b.toString(2).padStart(8, '0')).join('');
    });
}

async function isValidChecksum(words) {
    const bits = toBinary(words.slice(0, words.length - 1));
    const entropyBits = bits.substring(0, Math.floor(bits.length / 33) * 32);
    const entropy = new Uint8Array(entropyBits.match(/.{1,8}/g).map(b => parseInt(b, 2)));
    const hashBits = await sha256(entropy);
    const checksumLength = words.length / 3;
    const checksumBits = hashBits.substring(0, checksumLength);
    const mnemonicBits = bits.substring(bits.length - checksumLength);
    return mnemonicBits === checksumBits;
}

document.getElementById("generateBtn").addEventListener("click", async () => {
    const count = parseInt(document.getElementById("wordCount").value);
    const output = document.getElementById("output");

    if (wordlist.length < 2048) {
        output.value = "Wordlist belum lengkap (gunakan wordlist.txt asli).";
        return;
    }

    let mnemonic = [];
    for (let i = 0; i < count - 1; i++) {
        const index = Math.floor(Math.random() * wordlist.length);
        mnemonic.push(wordlist[index]);
    }

    // Append one last word to make checksum valid (skip true validation for now)
    mnemonic.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
    output.value = mnemonic.join(" ");

    const valid = await isValidChecksum(mnemonic);
    document.getElementById("status").textContent = valid ? "✅ Valid Checksum" : "❌ Invalid Checksum";

    generateQR(output.value);
});

document.getElementById("copyBtn").addEventListener("click", () => {
    const output = document.getElementById("output");
    output.select();
    output.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(output.value);
    alert("Copied to clipboard!");
});

document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

function generateQR(text) {
    const qrcodeContainer = document.getElementById("qrcode");
    qrcodeContainer.innerHTML = "";
    new QRCode(qrcodeContainer, {
        text: text,
        width: 256,
        height: 256
    });
}
