export type Lang = 'es' | 'en'

export const t = {
  es: {
    nav: {
      toggle: 'English',
    },
    hero: {
      badge: 'Portfolio Project',
      title: 'Form Engine',
      subtitle:
        'Un motor declarativo que convierte un JSON en un formulario React completamente funcional: validaciones, campos condicionales, wizards y más — sin escribir una línea de JSX.',
    },
    useCases: {
      title: '¿Quién usa esto en el mundo real?',
      intro:
        'Los motores de formularios declarativos no son un experimento académico. Son la arquitectura que está detrás de los productos más grandes del mundo cuando el problema es: "los formularios cambian seguido, y no podemos tocar el código cada vez".',
      whyTitle: '¿Por qué importa este enfoque?',
      why: 'La clave es la separación de responsabilidades. Las reglas del negocio (qué campos mostrar, qué validar, cuántos pasos tiene el flujo) viven en datos — no en código. Esto significa que un product manager puede rediseñar un flujo de onboarding, un equipo de compliance puede cambiar los campos requeridos por regulación, o un equipo de growth puede hacer A/B testing de formularios — todo sin deployar código nuevo. Eso es poder real.',
      items: [
        {
          icon: '🏦',
          industry: 'Fintech y Banca',
          companies: 'Nubank, Mercado Pago, Stripe, Plaid',
          desc: 'Los formularios de apertura de cuenta y solicitud de crédito cambian según el país, el tipo de cliente (persona física vs empresa) y el perfil de riesgo. En Nubank, el flujo de KYC (Know Your Customer) tiene ramas completamente distintas según la respuesta del usuario. Con schemas declarativos, el equipo de compliance actualiza las reglas sin bloquear a engineering.',
        },
        {
          icon: '🏥',
          industry: 'Salud y Seguros',
          companies: 'Oscar Health, Lemonade, Epic Systems',
          desc: 'Un formulario de reclamo de seguro de auto es radicalmente diferente a uno de hogar o de vida. Oscar Health y Lemonade generan sus flujos de reclamación dinámicamente. En salud, el historial del paciente determina qué preguntas se hacen — una forma de condicionalidad que no podés hardcodear en componentes React sin que el mantenimiento sea un desastre.',
        },
        {
          icon: '🛒',
          industry: 'E-commerce y Checkout',
          companies: 'Shopify, Stripe, MercadoLibre',
          desc: 'El formulario de checkout de Shopify muestra "Province" solo si el país es Canadá, "State" si es Estados Unidos, y lo oculta completamente en países donde no aplica. Los campos de facturación cambian por régimen fiscal. Estos comportamientos se expresan perfectamente como condiciones declarativas — modificarlos es cambiar una regla, no reescribir componentes.',
        },
        {
          icon: '👥',
          industry: 'HR y Recruiting',
          companies: 'Workday, Greenhouse, Rippling',
          desc: 'Las plataformas de HR tienen formularios que varían por país, por tipo de contrato y por política de la empresa. Greenhouse genera formularios de aplicación distintos por cada puesto. Workday construye el flujo de onboarding del empleado dinámicamente según el departamento y la jurisdicción. El schema del formulario es configuración de negocio, no código de producto.',
        },
        {
          icon: '🧩',
          industry: 'Plataformas No-Code',
          companies: 'Typeform, JotForm, Airtable, Google Forms',
          desc: 'Su producto COMPLETO es un form engine. Typeform renderiza formularios desde una definición JSON que sus usuarios crean visualmente. JotForm tiene más de 10 millones de formularios activos generados por schema. Este proyecto reproduce exactamente ese núcleo: la diferencia es que acá el schema lo escribís a mano y ves exactamente qué hay debajo del capó.',
        },
        {
          icon: '🏛️',
          industry: 'Gobierno y Sector Público',
          companies: 'Login.gov (EE.UU.), AFIP (Argentina), GOV.UK',
          desc: 'Los trámites digitales del gobierno son formularios con lógica de negocio compleja: el formulario de beneficios cambia según el tipo de prestación, la situación laboral y la jurisdicción. GOV.UK construyó su sistema de formularios sobre una arquitectura declarativa exactamente por esta razón: las reglas del Estado cambian por ley, no por feature request de un developer.',
        },
      ],
    },
    howItWorks: {
      title: 'Cómo funciona',
      layers: [
        {
          label: 'JSON Schema',
          desc: 'Vos escribís un objeto JSON que describe los campos, validaciones y condiciones del formulario.',
        },
        {
          label: 'Engine Core',
          desc: 'El engine valida el schema con Zod, construye el grafo de dependencias y genera el resolver de validación en tiempo de ejecución.',
        },
        {
          label: 'React Form',
          desc: 'React Hook Form renderiza el formulario. Los campos aparecen y desaparecen en vivo según las condiciones que definiste.',
        },
      ],
      arrow: '→',
      details: {
        title: 'Las capas internas',
        items: [
          {
            name: 'Schema Contract',
            desc: 'Define el contrato de los datos: tipos de campo, validaciones y estructura. Validado por Zod en tiempo de ejecución.',
          },
          {
            name: 'Condition Evaluator',
            desc: 'Evalúa las reglas showIf para determinar qué campos son visibles según los valores actuales del formulario.',
          },
          {
            name: 'Dependency Graph',
            desc: 'Construye el grafo de dependencias entre campos y detecta ciclos antes de renderizar.',
          },
          {
            name: 'Zod Resolver',
            desc: 'Genera el schema de validación de Zod dinámicamente y lo adapta para React Hook Form.',
          },
          {
            name: 'Field Registry',
            desc: 'Mapea cada tipo de campo (text, select, array…) a su componente React. Extensible por diseño.',
          },
        ],
      },
    },
    howToUse: {
      title: 'Cómo usar la aplicación',
      demos: {
        title: 'Explorar los Demos',
        steps: [
          'Hacé clic en la pestaña Demos en el encabezado.',
          'Seleccioná uno de los tres formularios de ejemplo: Solicitud de Crédito, Reclamación de Seguro o Encuesta.',
          'Interactuá con el formulario: observá cómo aparecen y desaparecen campos según tus respuestas.',
          'Intentá enviar el formulario incompleto para ver las validaciones en acción.',
        ],
      },
      playground: {
        title: 'Usar el Playground',
        steps: [
          'Hacé clic en la pestaña Playground en el encabezado.',
          'El panel izquierdo es un editor JSON con resaltado de sintaxis.',
          'El panel derecho muestra el formulario en vivo — se actualiza automáticamente mientras editás.',
          'Si el JSON tiene errores, aparece un panel rojo abajo del editor con el detalle del problema.',
          'Pegá cualquiera de los ejemplos de esta página para empezar rápido.',
        ],
      },
    },
    schemaGuide: {
      title: 'Guía de schemas JSON',
      rootTitle: 'Estructura raíz',
      rootDesc: 'Un formulario puede ser plano (todos los campos en una pantalla) o multi-step (wizard).',
      fieldTypesTitle: 'Tipos de campo',
      fieldTypes: [
        { type: 'text', desc: 'Campo de texto libre' },
        { type: 'number', desc: 'Campo numérico' },
        { type: 'tel', desc: 'Número de teléfono' },
        { type: 'select', desc: 'Lista desplegable (requiere items[])' },
        { type: 'checkbox', desc: 'Casilla de verificación (booleano)' },
        { type: 'file', desc: 'Carga de archivo' },
        { type: 'array', desc: 'Grupo repetible (requiere fields[])' },
        { type: 'group', desc: 'Agrupación visual (requiere fields[])' },
      ],
      validationsTitle: 'Validaciones disponibles',
      validations: [
        { key: 'required', desc: 'Campo obligatorio' },
        { key: 'min / max', desc: 'Valor mínimo / máximo (número)' },
        { key: 'minLength / maxLength', desc: 'Longitud mínima / máxima (texto)' },
        { key: 'pattern', desc: 'Expresión regular (ReDoS protegido)' },
        { key: 'minItems / maxItems', desc: 'Cantidad mínima / máxima de ítems (array)' },
      ],
      conditionsTitle: 'Condiciones (showIf)',
      conditionsDesc:
        'Usá showIf para mostrar u ocultar campos según los valores actuales del formulario.',
      operators: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'],
      operatorsLabel: 'Operadores disponibles:',
    },
    examples: {
      title: 'Ejemplos de schemas',
      subtitle: 'Cinco ejemplos de complejidad creciente. Copiálos y pegálos en el Playground.',
      copyBtn: 'Copiar',
      copiedBtn: 'Copiado!',
      tryBtn: 'Probar en Playground',
      items: [
        {
          title: 'Hola Mundo',
          tag: 'Plano · 2 campos',
          desc: 'El formulario más simple posible. Dos campos de texto, sin validaciones, sin condiciones.',
        },
        {
          title: 'Formulario de Contacto',
          tag: 'Plano · validaciones',
          desc: 'Campos con validaciones básicas: obligatorio, longitud mínima y un select con opciones.',
        },
        {
          title: 'Registro Condicional',
          tag: 'Plano · showIf',
          desc: 'Campos que aparecen y desaparecen según la selección del usuario. Ideal para ver las condiciones en acción.',
        },
        {
          title: 'Encuesta Multi-Paso',
          tag: 'Wizard · 3 pasos',
          desc: 'Formulario dividido en pasos con barra de progreso. Incluye select, número y un campo condicional.',
        },
        {
          title: 'Solicitud de Crédito',
          tag: 'Wizard · array + condiciones',
          desc: 'El schema más completo: wizard de 3 pasos, campos de array (referencias), condiciones OR y validación por regex.',
        },
      ],
    },
    footer: {
      builtBy: 'Construido por',
      name: 'Lennin Ibarra',
      links: [
        { label: 'GitHub', url: 'https://github.com/lenninIbarrraGonzalez/form-engine' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/lennin-geovanny-ibarra/' },
        { label: 'Portfolio', url: 'https://lenninibarra.netlify.app/en' },
      ],
    },
    tips: {
      title: 'Tips para explorar',
      items: [
        {
          icon: '🚀',
          title: 'Empezá con un ejemplo',
          desc: 'Hacé clic en "Probar en Playground" en el Ejemplo 1 para ver el motor en acción de inmediato.',
        },
        {
          icon: '💥',
          title: 'Rompelo a propósito',
          desc: 'En el Playground, borrá una comilla o escribí un tipo de campo inválido. El panel de errores te muestra exactamente qué está mal.',
        },
        {
          icon: '✨',
          title: 'Agregá una condición',
          desc: 'Copiá el Ejemplo 2 al Playground, luego agregá showIf a uno de los campos. Observá cómo desaparece en vivo.',
        },
        {
          icon: '🔍',
          title: 'Explorá los demos reales',
          desc: 'Los demos usan los mismos schemas que podés copiar desde Demos → clic en el código fuente en GitHub.',
        },
      ],
    },
  },

  en: {
    nav: {
      toggle: 'Español',
    },
    hero: {
      badge: 'Portfolio Project',
      title: 'Form Engine',
      subtitle:
        'A declarative engine that converts a JSON schema into a fully functional React form — validations, conditional fields, wizards, and more — without writing a single line of JSX.',
    },
    useCases: {
      title: 'Who uses this in the real world?',
      intro:
        'Declarative form engines are not an academic experiment. They are the architecture behind the largest products in the world when the problem is: "forms change often, and we cannot touch the code every time".',
      whyTitle: 'Why does this approach matter?',
      why: 'The key is separation of concerns. Business rules — which fields to show, what to validate, how many steps a flow has — live in data, not in code. This means a product manager can redesign an onboarding flow, a compliance team can update required fields due to regulation, or a growth team can A/B test forms — all without deploying new code. That is real leverage.',
      items: [
        {
          icon: '🏦',
          industry: 'Fintech & Banking',
          companies: 'Nubank, Mercado Pago, Stripe, Plaid',
          desc: 'Account opening and credit application forms change based on country, customer type (individual vs. company), and risk profile. Nubank\'s KYC (Know Your Customer) flow has completely different branches depending on user answers. With declarative schemas, the compliance team updates the rules without blocking engineering.',
        },
        {
          icon: '🏥',
          industry: 'Healthcare & Insurance',
          companies: 'Oscar Health, Lemonade, Epic Systems',
          desc: 'An auto insurance claim form is radically different from a home or life claim. Oscar Health and Lemonade generate their claim flows dynamically. In healthcare, patient history determines which questions are asked — a kind of conditionality you cannot hardcode into React components without making maintenance a nightmare.',
        },
        {
          icon: '🛒',
          industry: 'E-commerce & Checkout',
          companies: 'Shopify, Stripe, MercadoLibre',
          desc: 'Shopify\'s checkout form shows "Province" only if the country is Canada, "State" for the United States, and hides it in countries where it does not apply. Billing fields change by tax regime. These behaviors are perfectly expressed as declarative conditions — changing them means updating a rule, not rewriting components.',
        },
        {
          icon: '👥',
          industry: 'HR & Recruiting',
          companies: 'Workday, Greenhouse, Rippling',
          desc: 'HR platforms have forms that vary by country, contract type, and company policy. Greenhouse generates different application forms per position. Workday dynamically builds the employee onboarding flow based on department and jurisdiction. The form schema is business configuration, not product code.',
        },
        {
          icon: '🧩',
          industry: 'No-code Platforms',
          companies: 'Typeform, JotForm, Airtable, Google Forms',
          desc: 'Their ENTIRE product is a form engine. Typeform renders forms from a JSON definition that their users create visually. JotForm has over 10 million active forms generated by schema. This project reproduces exactly that core — the difference is that here you write the schema by hand and see exactly what is under the hood.',
        },
        {
          icon: '🏛️',
          industry: 'Government & Public Sector',
          companies: 'Login.gov (US), GOV.UK, Digital public services',
          desc: 'Government digital services are forms with complex business logic: a benefits form changes based on benefit type, employment status, and jurisdiction. GOV.UK built its form system on a declarative architecture for exactly this reason — government rules change by law, not by a developer\'s feature request.',
        },
      ],
    },
    howItWorks: {
      title: 'How it works',
      layers: [
        {
          label: 'JSON Schema',
          desc: 'You write a JSON object that describes the fields, validations, and conditions of the form.',
        },
        {
          label: 'Engine Core',
          desc: 'The engine validates the schema with Zod, builds the dependency graph, and generates the validation resolver at runtime.',
        },
        {
          label: 'React Form',
          desc: 'React Hook Form renders the form. Fields appear and disappear live based on the conditions you defined.',
        },
      ],
      arrow: '→',
      details: {
        title: 'Internal layers',
        items: [
          {
            name: 'Schema Contract',
            desc: 'Defines the data contract: field types, validations, and structure. Validated by Zod at runtime.',
          },
          {
            name: 'Condition Evaluator',
            desc: 'Evaluates showIf rules to determine which fields are visible based on the current form values.',
          },
          {
            name: 'Dependency Graph',
            desc: 'Builds the dependency graph between fields and detects cycles before rendering.',
          },
          {
            name: 'Zod Resolver',
            desc: 'Dynamically generates the Zod validation schema and adapts it for React Hook Form.',
          },
          {
            name: 'Field Registry',
            desc: 'Maps each field type (text, select, array…) to its React component. Extensible by design.',
          },
        ],
      },
    },
    howToUse: {
      title: 'How to use the app',
      demos: {
        title: 'Explore the Demos',
        steps: [
          'Click the Demos tab in the header.',
          'Select one of the three example forms: Credit Application, Insurance Claim, or Survey.',
          'Interact with the form: watch how fields appear and disappear based on your answers.',
          'Try submitting the form with missing data to see validations in action.',
        ],
      },
      playground: {
        title: 'Use the Playground',
        steps: [
          'Click the Playground tab in the header.',
          'The left panel is a JSON editor with syntax highlighting.',
          'The right panel shows the live form — it updates automatically as you type.',
          'If the JSON has errors, a red panel appears below the editor with the issue detail.',
          'Paste any of the examples from this page to get started quickly.',
        ],
      },
    },
    schemaGuide: {
      title: 'JSON Schema Guide',
      rootTitle: 'Root structure',
      rootDesc: 'A form can be flat (all fields on one screen) or multi-step (wizard).',
      fieldTypesTitle: 'Field types',
      fieldTypes: [
        { type: 'text', desc: 'Free-text input' },
        { type: 'number', desc: 'Numeric input' },
        { type: 'tel', desc: 'Phone number' },
        { type: 'select', desc: 'Dropdown list (requires items[])' },
        { type: 'checkbox', desc: 'Boolean checkbox' },
        { type: 'file', desc: 'File upload' },
        { type: 'array', desc: 'Repeatable group (requires fields[])' },
        { type: 'group', desc: 'Visual grouping (requires fields[])' },
      ],
      validationsTitle: 'Available validations',
      validations: [
        { key: 'required', desc: 'Required field' },
        { key: 'min / max', desc: 'Minimum / maximum value (number)' },
        { key: 'minLength / maxLength', desc: 'Minimum / maximum length (text)' },
        { key: 'pattern', desc: 'Regular expression (ReDoS protected)' },
        { key: 'minItems / maxItems', desc: 'Minimum / maximum number of items (array)' },
      ],
      conditionsTitle: 'Conditions (showIf)',
      conditionsDesc:
        'Use showIf to show or hide fields based on the current form values.',
      operators: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'],
      operatorsLabel: 'Available operators:',
    },
    examples: {
      title: 'Schema examples',
      subtitle: 'Five examples of increasing complexity. Copy and paste them into the Playground.',
      copyBtn: 'Copy',
      copiedBtn: 'Copied!',
      tryBtn: 'Try in Playground',
      items: [
        {
          title: 'Hello World',
          tag: 'Flat · 2 fields',
          desc: 'The simplest possible form. Two text fields, no validations, no conditions.',
        },
        {
          title: 'Contact Form',
          tag: 'Flat · validations',
          desc: 'Fields with basic validations: required, minimum length, and a select with options.',
        },
        {
          title: 'Conditional Registration',
          tag: 'Flat · showIf',
          desc: 'Fields that appear and disappear based on the user selection. Perfect to see conditions in action.',
        },
        {
          title: 'Multi-step Survey',
          tag: 'Wizard · 3 steps',
          desc: 'Form split into steps with a progress bar. Includes select, number, and a conditional field.',
        },
        {
          title: 'Credit Application',
          tag: 'Wizard · array + conditions',
          desc: 'The most complete schema: 3-step wizard, array fields (references), OR conditions, and regex validation.',
        },
      ],
    },
    tips: {
      title: 'Tips to explore',
      items: [
        {
          icon: '🚀',
          title: 'Start with an example',
          desc: 'Click "Try in Playground" on Example 1 to see the engine in action right away.',
        },
        {
          icon: '💥',
          title: 'Break it on purpose',
          desc: 'In the Playground, delete a quote or type an invalid field type. The error panel shows exactly what went wrong.',
        },
        {
          icon: '✨',
          title: 'Add a condition',
          desc: 'Copy Example 2 to the Playground, then add showIf to one of the fields. Watch it disappear live.',
        },
        {
          icon: '🔍',
          title: 'Explore the real demos',
          desc: 'The demos use the same schemas — you can inspect them in the source code on GitHub.',
        },
      ],
    },
    footer: {
      builtBy: 'Built by',
      name: 'Lennin Ibarra',
      links: [
        { label: 'GitHub', url: 'https://github.com/lenninIbarrraGonzalez/form-engine' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/lennin-geovanny-ibarra/' },
        { label: 'Portfolio', url: 'https://lenninibarra.netlify.app/en' },
      ],
    },
  },
} as const
