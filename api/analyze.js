import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // On accepte uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Pas d'image reçue" });
    }

    // Nettoyage de l'image (suppression de l'en-tête data:image...)
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // Connexion à Gemini via la clé sécurisée sur Vercel
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Agis comme un expert Vinted. Analyse cette image.
    Réponds UNIQUEMENT avec ce format JSON strict :
    {
        "titre": "Marque Modèle État",
        "prix": "Estimation XX€",
        "categorie": "La catégorie exacte",
        "description": "Description vendeuse avec émojis...",
        "hashtags": "#tag1 #tag2"
    }`;

    // Envoi à l'IA
    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // On renvoie le résultat au site
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
}