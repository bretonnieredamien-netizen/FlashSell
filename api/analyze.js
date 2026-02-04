import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Sécurité : On accepte uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 2. Vérification de la Clé API côté serveur
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("Clé API Google manquante dans les variables Vercel");
    }

    // 3. Récupération de l'image envoyée par le site
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Pas d'image reçue" });
    }

    // 4. Nettoyage du format Base64 pour l'IA
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // 5. Configuration de Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // On utilise le modèle rapide et stable
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    // 6. LE PROMPT OPTIMISÉ (Spécial "Prix Haut")
    const prompt = `Agis comme un expert mondial de la revente (Reselling) sur Vinted et Depop.
    Ta mission : Maximiser le profit du vendeur.
    
    Analyse cette image pixel par pixel pour identifier : Marque, Modèle précis, Collection, État visuel.
    
    Réponds UNIQUEMENT avec ce format JSON strict :
    {
        "titre": "Marque Modèle + Mots clés SEO (ex: Vintage, Y2K, Rare)",
        "prix": "XX€ - YY€ (Vise la fourchette HAUTE du marché de l'occasion pour cet objet précis. Ne sous-estime pas.)",
        "categorie": "La catégorie Vinted exacte (Chemin complet)",
        "description": "Description persuasive utilisant la technique AIDA (Attention, Intérêt, Désir, Action). Mentionne l'état, les détails de style et des suggestions de tenue. Utilise des émojis.",
        "hashtags": "10 hashtags pertinents séparés par des espaces"
    }`;

    // 7. Génération de l'analyse
    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 8. Envoi de la réponse au site
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("ERREUR SERVEUR:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de l'analyse" });
  }
}