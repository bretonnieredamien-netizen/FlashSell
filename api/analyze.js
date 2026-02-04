import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Autoriser uniquement les envois de données (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 2. Vérifier la Clé API (C'est souvent là que ça bloque)
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("Clé API manquante dans Vercel");
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Pas d'image reçue" });
    }

    // 3. Préparer l'image
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // 4. Connexion à l'IA
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // CORRECTION ICI : On utilise le modèle stable "gemini-1.5-flash"
    // (Si tu as vraiment accès à une beta 2.5, change le nom ici)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Agis comme un expert Vinted. Analyse cette image.
    Réponds UNIQUEMENT avec ce format JSON strict :
    {
        "titre": "Marque Modèle État",
        "prix": "XX€",
        "categorie": "Catégorie exacte",
        "description": "Description vendeuse avec émojis...",
        "hashtags": "#tag1 #tag2"
    }`;

    // 5. Génération
    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 6. Envoi de la réponse
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("ERREUR SERVEUR:", error);
    // On renvoie l'erreur exacte pour t'aider à débugger
    res.status(500).json({ error: error.message || "Erreur interne" });
  }
}