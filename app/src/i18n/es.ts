import type { Texts } from './en'

// Los textos de la app en español (de "tú"). Tienen la misma forma que en `en.ts`, y TypeScript lo comprueba.
// Los nombres de las pestañas (Mapa, Repasar, Escribir, Perfil) son los que tendrá la barra de abajo al traducirla.

export const es: Texts = {
  language: { continue: 'Continuar' },
  google: 'Continuar con Google',
  welcome: {
    saveTitle: '¿Guardamos tu progreso?',
    saveText: 'Inicia sesión para seguir desde cualquier teléfono o computador, o juega como invitado.',
    guest: 'Jugar como invitado',
    guestNote: 'Como invitado, tu progreso se guarda solo en este dispositivo. Puedes iniciar sesión después desde Perfil y no pierdes nada.',
    nameTitle: '¿Cómo te llamamos?',
    nameText: 'Un nombre o un apodo, como quieras.',
    nameTextGuest: 'Un nombre o un apodo, como quieras. Tu progreso se queda en este dispositivo.',
    namePlaceholder: 'Tu nombre',
    nameLabel: 'Tu nombre o apodo',
    go: '¡Vamos!',
    back: 'Atrás',
  },
  intro: {
    skip: 'Saltar',
    next: 'Siguiente',
    letsGo: '¡Vamos!',
    slides: [
      {
        alt: 'Los cuatro amigos sonriendo juntos al amanecer, con el trencito en el puente detrás',
        title: (name) => (name ? `¡Hola, ${name}!` : '¡Hola!'),
        text: 'Somos Wāwa, Yīngyīng, Lǎnlǎn y Zuǐzuǐ, tus compañeros de viaje. Vamos a aprender mandarín juntos, parada por parada.',
        tab: '',
      },
      {
        alt: 'Los amigos en el andén, mirando un celular que muestra el mapa',
        title: () => 'Viaja por Panamá',
        text: 'El Mapa es tu casa. Toca una provincia para abrir sus puertas.',
        tab: 'Mapa',
      },
      {
        alt: 'Wāwa señalando un celular que muestra las puertas de una provincia, junto a una puerta roja',
        title: () => 'Abre una puerta, aprende 5 palabras',
        text: 'Cada puerta es una lección: cinco palabras nuevas y luego ejercicios cortos. Desliza entre las puertas y toca para empezar.',
        tab: 'Lecciones',
      },
      {
        alt: 'Los amigos en una mesa, escuchando y escribiendo, mientras Wāwa señala un celular que muestra un carácter para trazar',
        title: () => 'Escribe con el dedo',
        text: 'En la pestaña Escribir, traza cada carácter trazo por trazo y luego escríbelo de memoria.',
        tab: 'Escribir',
      },
      {
        alt: 'Wāwa celebrando junto a gemas azules y un celular que muestra una tarjeta de repaso',
        title: () => 'Repasa y gana gemas',
        text: 'En la pestaña Repasar, cada palabra vuelve justo antes de que la olvides. Dinos qué tan bien la recordaste.',
        tab: 'Repasar',
      },
      {
        alt: 'Los cuatro amigos alrededor de un celular que muestra el perfil con los compañeros de viaje',
        title: () => 'Hazlo tuyo',
        text: 'En Perfil, elige a tu compañero de viaje y mira crecer tu racha, tus puntos y tus gemas.',
        tab: 'Perfil',
      },
    ],
  },
  profile: {
    hi: (name) => (name ? `¡Hola, ${name}!` : '¡Hola!'),
    yourName: 'Tu nombre',
    tourTitle: 'Cómo funciona',
    tourText: 'Un recorrido rápido por el mapa, las puertas, los ejercicios y las tarjetas de repaso.',
    tourButton: 'Ver el recorrido',
    languageTitle: 'Idioma',
    languageText: 'Las palabras y explicaciones de la app.',
  },
  nudge: {
    label: 'Guarda tu progreso',
    lesson: '¡Primera lección terminada!',
    streak: (days) => `¡${days} días seguidos!`,
    text: 'Ahora mismo tu progreso está solo en este dispositivo. Guárdalo en una cuenta para que perder el teléfono o borrar el navegador no te lo quite.',
    iphone: ' En iPhone, también puedes tocar Compartir y luego “Añadir a pantalla de inicio”.',
    notNow: 'Ahora no',
  },
  app: { welcomeBack: (name) => `¡Bienvenido de nuevo, ${name}!` },
}
