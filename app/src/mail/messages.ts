// The words of SNS's emails, in the person's language (PR-01). Plain everyday Sinhala; English words SNS already uses.
type Lang = 'si' | 'en';

export function codeMail(lang: Lang, code: string) {
  return lang === 'en'
    ? { subject: `SNS Rent Car sign-in code: ${code}`, text: `Your sign-in code is ${code}.\nIt works once, for 10 minutes.\nIf you did not try to sign in, tell the owner.` }
    : { subject: `SNS Rent Car ඇතුල් වීමේ අංකය: ${code}`, text: `ඔයාගේ ඇතුල් වීමේ අංකය ${code}.\nඒක එක පාරක් විතරයි, විනාඩි 10 ක් ඇතුළත වැඩ කරනවා.\nඔයා ඇතුල් වෙන්න හැදුවේ නැත්නම්, අයිතිකරුට කියන්න.` };
}

export function confirmMail(lang: Lang, code: string) {
  return lang === 'en'
    ? { subject: `SNS Rent Car: confirm your email (${code})`, text: `To confirm this email for SNS Rent Car, type this code: ${code}.\nIt works once, for 10 minutes.` }
    : { subject: `SNS Rent Car: email එක තහවුරු කරන්න (${code})`, text: `SNS Rent Car වලට මේ email එක තහවුරු කරන්න මේ අංකය දාන්න: ${code}.\nඒක එක පාරක් විතරයි, විනාඩි 10 ක් ඇතුළත වැඩ කරනවා.` };
}

export function resetMail(lang: Lang, url: string) {
  return lang === 'en'
    ? { subject: 'SNS Rent Car: set a new password', text: `Open this link to set a new password:\n${url}\nIt works once, for 1 hour. If you did not ask for it, ignore this email and tell the owner.` }
    : { subject: 'SNS Rent Car: අලුත් මුරපදයක් දාන්න', text: `අලුත් මුරපදයක් දාන්න මේ link එක අරින්න:\n${url}\nඒක එක පාරක් විතරයි, පැය 1 ක් ඇතුළත වැඩ කරනවා. ඔයා ඉල්ලුවේ නැත්නම්, මේක අත්හැරලා අයිතිකරුට කියන්න.` };
}
