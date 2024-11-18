// src/services/TranslateDescription.ts

export const translateDescription = async (description: string): Promise<string> => {
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=AIzaSyABoN3EsB_jyScms9laVjpwoUeFre5jmhU`, {
      method: 'POST',
      body: JSON.stringify({
        q: description,
        target: 'en'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText;
    } else {
      console.error('Translation API response is invalid:', data);
      return '';
    }
  } catch (error) {
    console.error('Error translating description:', error);
    return '';
  }
};