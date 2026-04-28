document.getElementById("generateBtn").addEventListener("click", function () {
  const patientName = document.getElementById("patientName").value;
  const message = document.getElementById("message").value;

  const output = `MEDICAL REFERRAL LETTER

Patient: ${patientName}

Details:
${message}

Kind regards,
Referring Doctor`;

  document.getElementById("output").textContent = output;
});
