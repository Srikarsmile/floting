class FloatingHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const assetBase = 'https://srikarsmile.github.io/floting/';
    const asset = (path) => `${assetBase}${String(path).replace(/^\/+/, '')}`;
    const year = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          color: #172526;
          background: #fbf6ec;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.5;
        }

        * { box-sizing: border-box; }

        a { color: inherit; text-decoration: none; }

        img { display: block; max-width: 100%; }

        .floating-site {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 10% 0%, rgba(95, 166, 151, 0.20), transparent 30%),
            linear-gradient(180deg, #fbf6ec 0%, #f2eadb 48%, #fbf6ec 100%);
        }

        .container {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .section {
          position: relative;
          padding: clamp(70px, 9vw, 130px) 0;
        }

        .section--cream { background: #f3eadb; }

        .section--dark {
          color: #fbf6ec;
          background:
            linear-gradient(135deg, rgba(23, 37, 38, 0.96), rgba(37, 73, 70, 0.94)),
            url("${asset('images/hub.png')}") center / cover;
        }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          color: #3f897f;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .section-label::before {
          content: "";
          width: 34px;
          height: 1px;
          background: currentColor;
        }

        .section-title,
        .hero-title,
        .cta h2 {
          margin: 0;
          color: #172526;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 500;
          letter-spacing: 0;
          line-height: 0.98;
        }

        .section--dark .section-title,
        .section--dark .section-label,
        .cta .section-label,
        .cta h2 { color: #fbf6ec; }

        .section-title { max-width: 760px; font-size: clamp(2.5rem, 6vw, 5.4rem); }

        .section-subtitle {
          max-width: 700px;
          margin: 22px 0 0;
          color: rgba(23, 37, 38, 0.70);
          font-size: clamp(1.02rem, 1.7vw, 1.22rem);
        }

        .section--dark .section-subtitle { color: rgba(251, 246, 236, 0.78); }

        .section-header {
          display: grid;
          gap: 10px;
          margin-bottom: clamp(36px, 6vw, 70px);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          padding: 13px 20px;
          border: 1px solid rgba(23, 37, 38, 0.18);
          border-radius: 999px;
          color: #172526;
          font-size: 0.92rem;
          font-weight: 800;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }

        .btn:hover { transform: translateY(-2px); }

        .btn-primary {
          color: #fbf6ec;
          background: #172526;
          border-color: #172526;
        }

        .btn-ghost { background: rgba(255,255,255,0.34); }

        .btn-white {
          color: #172526;
          background: #fbf6ec;
          border-color: #fbf6ec;
        }

        .btn-glass {
          color: #fbf6ec;
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.24);
        }

        .hero {
          min-height: clamp(720px, 100vh, 940px);
          display: grid;
          align-items: center;
          padding: clamp(80px, 9vw, 130px) 0 clamp(70px, 7vw, 110px);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
          gap: clamp(44px, 7vw, 92px);
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: 1px solid rgba(23,37,38,0.14);
          border-radius: 999px;
          background: rgba(255,255,255,0.46);
          color: rgba(23,37,38,0.72);
          font-size: 0.82rem;
          font-weight: 800;
        }

        .hero-title {
          max-width: 780px;
          margin-top: 22px;
          font-size: clamp(4rem, 10vw, 9.5rem);
        }

        .hero-copy {
          max-width: 620px;
          margin: 26px 0 0;
          color: rgba(23,37,38,0.72);
          font-size: clamp(1.06rem, 1.65vw, 1.3rem);
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
        }

        .hero-note {
          max-width: 560px;
          margin-top: 32px;
          padding-left: 18px;
          border-left: 2px solid #5fa697;
          color: rgba(23,37,38,0.68);
        }

        .hero-visual {
          position: relative;
          min-height: 620px;
        }

        .hero-frame {
          position: absolute;
          inset: 0 0 0 8%;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 34px 100px rgba(23, 37, 38, 0.18);
          transform: rotate(2deg);
        }

        .hero-frame img { width: 100%; height: 100%; object-fit: cover; }

        .hero-card {
          position: absolute;
          left: 0;
          bottom: 60px;
          width: min(310px, 78%);
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.45);
          border-radius: 24px;
          background: rgba(251,246,236,0.88);
          box-shadow: 0 20px 60px rgba(23, 37, 38, 0.18);
          backdrop-filter: blur(18px);
        }

        .hero-card strong {
          display: block;
          margin-bottom: 7px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.7rem;
          font-weight: 500;
        }

        .impact {
          background: #172526;
          color: #fbf6ec;
        }

        .impact .section-label { color: #9fd5c9; }

        .stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 24px;
          margin-top: 40px;
        }

        .stat {
          padding: 26px 20px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          background: rgba(255,255,255,0.06);
        }

        .stat h3 {
          margin: 0;
          color: #fbf6ec;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(2.1rem, 4.2vw, 4.8rem);
          font-weight: 500;
          line-height: 1;
        }

        .stat p {
          margin: 12px 0 0;
          color: rgba(251,246,236,0.72);
          font-size: 0.9rem;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .service-card,
        .testimonial-card,
        .team-card,
        .faq-item,
        .contact-card {
          border: 1px solid rgba(23,37,38,0.10);
          border-radius: 24px;
          background: rgba(255,255,255,0.72);
          box-shadow: 0 18px 50px rgba(23,37,38,0.07);
        }

        .service-card {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          padding: 26px;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 70px rgba(23,37,38,0.12);
        }

        .service-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin-bottom: 24px;
          border-radius: 18px;
          color: #172526;
          background: #dbeee9;
        }

        .service-icon svg { width: 25px; height: 25px; }

        .service-card h3 {
          margin: 0;
          color: #172526;
          font-size: 1.28rem;
          line-height: 1.12;
        }

        .service-card p {
          margin: 15px 0 24px;
          color: rgba(23,37,38,0.66);
          font-size: 0.96rem;
        }

        .learn-more {
          margin-top: auto;
          color: #3f897f;
          font-weight: 800;
        }

        .about-grid,
        .hub-grid,
        .contact-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: clamp(44px, 7vw, 84px);
          align-items: center;
        }

        .about-image-frame,
        .hub-image-frame {
          aspect-ratio: 4 / 5;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 26px 80px rgba(23,37,38,0.16);
        }

        .about-image-frame img,
        .hub-image-frame img { width: 100%; height: 100%; object-fit: cover; }

        .values {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 30px;
        }

        .value {
          padding: 14px 16px;
          border-radius: 999px;
          background: rgba(95,166,151,0.12);
          color: #224946;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .hub-features {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 34px;
        }

        .hub-feature {
          padding: 20px;
          border: 1px solid rgba(251,246,236,0.14);
          border-radius: 22px;
          background: rgba(255,255,255,0.07);
        }

        .hub-feature h4 { margin: 0 0 6px; font-size: 1rem; }
        .hub-feature p { margin: 0; color: rgba(251,246,236,0.70); font-size: 0.86rem; }

        .hub-info {
          display: grid;
          gap: 12px;
          margin-top: 28px;
        }

        .hub-info-item {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 0;
          border-top: 1px solid rgba(251,246,236,0.16);
        }

        .info-label { color: rgba(251,246,236,0.58); }
        .info-value { text-align: right; font-weight: 800; }

        .testimonials-grid,
        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .testimonial-card {
          padding: 26px;
          min-height: 270px;
        }

        .quote {
          color: #5fa697;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 4rem;
          line-height: 0.7;
        }

        .testimonial-card p { color: rgba(23,37,38,0.70); }

        .testimonial-author {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 24px;
        }

        .avatar,
        .team-avatar {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #172526;
          color: #fbf6ec;
          font-weight: 900;
        }

        .testimonial-author h4 { margin: 0; }
        .testimonial-author span { color: rgba(23,37,38,0.54); font-size: 0.86rem; }

        .team-card {
          min-height: 215px;
          padding: 24px;
        }

        .team-card h4 { margin: 18px 0 8px; font-size: 1.1rem; }
        .team-card p { margin: 0; color: rgba(23,37,38,0.62); }
        .team-card a { display: inline-block; margin-top: 16px; color: #3f897f; font-weight: 800; }

        .faq-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
          gap: clamp(36px, 7vw, 80px);
          align-items: start;
        }

        .faq-list { display: grid; gap: 12px; }

        .faq-item {
          padding: 0;
          overflow: hidden;
        }

        .faq-item summary {
          cursor: pointer;
          padding: 22px 24px;
          font-weight: 900;
          list-style: none;
        }

        .faq-item summary::-webkit-details-marker { display: none; }

        .faq-item p {
          margin: 0;
          padding: 0 24px 24px;
          color: rgba(23,37,38,0.66);
        }

        .contact-grid { align-items: start; }

        .contact-card {
          padding: 28px;
        }

        .contact-list {
          display: grid;
          gap: 18px;
          margin: 28px 0;
          padding: 0;
          list-style: none;
        }

        .contact-list li {
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(23,37,38,0.10);
        }

        .contact-list strong { display: block; margin-bottom: 5px; }
        .contact-list a, .contact-list span { color: rgba(23,37,38,0.70); }

        .mini-form {
          display: grid;
          gap: 14px;
        }

        .mini-form input,
        .mini-form select,
        .mini-form textarea {
          width: 100%;
          min-height: 48px;
          padding: 12px 14px;
          border: 1px solid rgba(23,37,38,0.14);
          border-radius: 14px;
          background: rgba(255,255,255,0.72);
          color: #172526;
          font: inherit;
        }

        .mini-form textarea { min-height: 130px; resize: vertical; }

        .cta {
          position: relative;
          padding: clamp(80px, 10vw, 130px) 0;
          color: #fbf6ec;
          background:
            radial-gradient(circle at 80% 25%, rgba(159,213,201,0.20), transparent 28%),
            linear-gradient(135deg, #172526, #335b57);
          text-align: center;
        }

        .cta h2 {
          max-width: 900px;
          margin: 0 auto;
          font-size: clamp(2.7rem, 6vw, 6.2rem);
        }

        .cta p {
          max-width: 720px;
          margin: 24px auto 0;
          color: rgba(251,246,236,0.78);
          font-size: clamp(1.02rem, 1.8vw, 1.25rem);
        }

        .cta-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
          margin-top: 34px;
        }

        .footer {
          padding: 40px 0;
          color: rgba(251,246,236,0.70);
          background: #101b1c;
        }

        .footer-grid {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
        }

        .footer img { width: 150px; height: auto; filter: brightness(1.14); }

        .footer p { margin: 12px 0 0; }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 700ms ease, transform 700ms ease;
        }

        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 980px) {
          .hero-grid,
          .about-grid,
          .hub-grid,
          .contact-grid,
          .faq-grid {
            grid-template-columns: 1fr;
          }

          .hero-visual { min-height: 520px; }
          .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .services-grid, .testimonials-grid, .team-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 640px) {
          .container { width: min(100% - 28px, 1120px); }
          .hero { min-height: auto; padding-top: 64px; }
          .hero-title { font-size: clamp(3.4rem, 17vw, 5rem); }
          .hero-visual { min-height: 420px; }
          .hero-frame { inset: 0; border-radius: 24px; }
          .hero-card { bottom: 20px; }
          .stats, .services-grid, .testimonials-grid, .team-grid, .values, .hub-features { grid-template-columns: 1fr; }
          .section-title { font-size: clamp(2.35rem, 12vw, 3.8rem); }
          .hub-info-item, .footer-grid { display: grid; }
          .info-value { text-align: left; }
        }
      </style>

      <main class="floating-site">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="hero-badge">Croydon & London | Since 2015</div>
              <h1 class="hero-title">Counselling, Community & Compassion.</h1>
              <p class="hero-copy">A UK-based grassroots charity empowering individuals, families and marginalised groups through holistic support, therapeutic care and community-driven programmes.</p>
              <div class="hero-actions">
                <a class="btn btn-primary" href="mailto:info@floatingcounselling.co.uk?subject=Counselling%20enquiry">Book a Session</a>
                <a class="btn btn-ghost" href="#floating-services">Our Services</a>
              </div>
              <p class="hero-note">Led by a diverse team of African women - clinically trained, lived experience, deeply rooted in community.</p>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <div class="hero-frame"><img src="${asset('images/hero.png')}" alt=""></div>
              <div class="hero-card"><strong>15,000+</strong><span>Counselling sessions delivered across Croydon and London.</span></div>
            </div>
          </div>
        </section>

        <section class="section impact reveal" aria-label="Our impact">
          <div class="container">
            <div class="section-label">Our impact</div>
            <h2 class="section-title">A decade of grassroots care, by the numbers.</h2>
            <div class="stats">
              <div class="stat"><h3>15,000+</h3><p>Counselling sessions delivered</p></div>
              <div class="stat"><h3>50,000+</h3><p>Clinical hours of care</p></div>
              <div class="stat"><h3>45 yrs</h3><p>Combined clinical experience</p></div>
              <div class="stat"><h3>1,400+</h3><p>Children supported through holiday school</p></div>
              <div class="stat"><h3>10+ yrs</h3><p>Continuous service to community</p></div>
            </div>
          </div>
        </section>

        <section class="section section--cream reveal" id="floating-services">
          <div class="container">
            <header class="section-header">
              <div class="section-label">What we offer</div>
              <h2 class="section-title">Six ways we hold space for you.</h2>
              <p class="section-subtitle">Whether you're looking for counselling, community, or just a hot meal and a smile - Floating is here for you.</p>
            </header>
            <div class="services-grid">
              ${this.serviceCard('Counselling & Mentoring', 'One-to-one, group, couple and family therapy with qualified psychotherapists. In-person and online via Zoom or Skype. Free to low-cost for eligible individuals.', 'Get started')}
              ${this.serviceCard('Impact Parenting', 'Workshops, 1:1 mentoring, and group programmes for parents - including therapeutic camps, the Impact Parenting Pillar training and a private support group.', 'Learn more')}
              ${this.serviceCard('Community Support', "Donated food distributed weekly from Tesco, Sainsbury's, Greggs, Lidl, Asda, Felix and Amazon to individuals and families in need.", 'Visit the hub')}
              ${this.serviceCard('Floating Community Hub', 'A weekly hub at Woodside Baptist Church offering housing support, mental health services, art therapy, bills help and massage therapy.', 'Find out more')}
              ${this.serviceCard('Financial Literacy & Business Training', 'Masterclasses and retreats supporting budgeting skills, entrepreneurial growth and confidence for the global majority community.', 'Enquire')}
              ${this.serviceCard('Holiday School & Camps', 'Art therapy, music, play therapy and psychological techniques for children aged 5-11. Over 1,400 children registered across recent programmes.', 'Register')}
            </div>
          </div>
        </section>

        <section class="section reveal">
          <div class="container about-grid">
            <div class="about-image-frame"><img src="${asset('images/counselling.png')}" alt="Counselling session at Floating Counselling"></div>
            <div>
              <div class="section-label">Who we are</div>
              <h2 class="section-title">Wraparound care, rooted in community.</h2>
              <p class="section-subtitle">Inspired by Maslow's hierarchy of needs, we meet people where they are - emotionally, practically and socially - to create lasting change and personal growth.</p>
              <p class="section-subtitle">We are proudly led by a diverse team of African women, whose lived experience and professional expertise shape every part of our work.</p>
              <div class="values">
                <div class="value">Trauma-informed care</div>
                <div class="value">Culturally relevant</div>
                <div class="value">NHS partnered</div>
                <div class="value">Holistic approach</div>
                <div class="value">Free and low-cost</div>
                <div class="value">Online and in-person</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section section--dark reveal">
          <div class="container hub-grid">
            <div>
              <div class="section-label">One-stop shop</div>
              <h2 class="section-title">Floating Community Hub.</h2>
              <p class="section-subtitle">A central gathering place for Croydon residents. Come together, have a cup of tea and a chat. We're here to help you thrive - not just survive.</p>
              <div class="hub-features">
                <div class="hub-feature"><h4>NHS Staff</h4><p>Weekly NHS link workers on-site</p></div>
                <div class="hub-feature"><h4>Housing Support</h4><p>Housing officer monthly visits</p></div>
                <div class="hub-feature"><h4>Art Therapy</h4><p>Creative healing workshops</p></div>
                <div class="hub-feature"><h4>Form Filling</h4><p>Benefit forms and applications</p></div>
                <div class="hub-feature"><h4>Food & Clothes</h4><p>Weekly food and clothes bank</p></div>
                <div class="hub-feature"><h4>Massage Therapy</h4><p>Wellbeing treatments</p></div>
              </div>
              <div class="hub-info">
                <div class="hub-info-item"><span class="info-label">Location</span><span class="info-value">Woodside Baptist Church, Spring Lane, SE25 4SP</span></div>
                <div class="hub-info-item"><span class="info-label">When</span><span class="info-value">Every Tuesday, 12:30 - 2:30pm</span></div>
              </div>
            </div>
            <div class="hub-image-frame"><img src="${asset('images/hub.png')}" alt="Floating Community Hub"></div>
          </div>
        </section>

        <section class="section reveal">
          <div class="container">
            <header class="section-header">
              <div class="section-label">What people say</div>
              <h2 class="section-title">In their own words.</h2>
              <p class="section-subtitle">Hear from the families and individuals whose lives have been transformed.</p>
            </header>
            <div class="testimonials-grid">
              ${this.testimonial('ST', 'Sarah Turino', 'CEO, The Whole Woman Wellness Formula | USA', 'I have learned so much from Impact Parenting Pillar training and Celestina. It was incredibly well-rounded, supporting a wide variety of issues that parents face.')}
              ${this.testimonial('DD', 'Danya Denny', 'Social Worker | UK', 'It was good for me to see and know myself better. The workbooks and cheat-sheets allowed me to look at my past traumas and find healthy ways to move forward for my children.')}
              ${this.testimonial('NK', 'Niina Kabesa', 'Mother of Nations', 'As a mother of 6, I learnt so much from Impact Parenting. I was able to adapt strategies to my real life and all my children straight away. Every parent needs this.')}
            </div>
          </div>
        </section>

        <section class="section section--cream reveal">
          <div class="container">
            <header class="section-header">
              <div class="section-label">Our people</div>
              <h2 class="section-title">Meet the team.</h2>
              <p class="section-subtitle">Led by a diverse team of African women with lived experience and professional expertise.</p>
            </header>
            <div class="team-grid">
              ${this.team('CO', 'Celestina Oniye-Thomas', 'CEO & Head of Charitable Operations', 'info@floatingcounselling.co.uk')}
              ${this.team('OO', 'Omowonu-Ola Ogunlela', 'Director & Head of Finance', 'floatingcounsellingcommunity@gmail.com')}
              ${this.team('EO', 'Elizabeth Owode', 'Director & Relationship Coach', '')}
              ${this.team('LY', 'Linda Yeboah', 'Director & Safeguarding Officer', 'floatingcounsellinglinda@gmail.com')}
              ${this.team('NK', 'Niina Kabesa', 'Holiday Camp Manager', '')}
              ${this.team('MG', 'Marleine Griffin', 'Admin Lead', 'info@floatingcounselling.co.uk')}
            </div>
          </div>
        </section>

        <section class="section section--cream reveal">
          <div class="container faq-grid">
            <div>
              <div class="section-label">Common questions</div>
              <h2 class="section-title">Everything you might be wondering.</h2>
              <p class="section-subtitle">If your question is not here, send us a note - we read every message.</p>
            </div>
            <div class="faq-list">
              ${this.faq('How much does counselling cost?', "Sessions are free or low-cost for eligible individuals. We work on a sliding scale based on circumstances. Our priority is access - we'll find a way that works for you.")}
              ${this.faq('What happens in the first session?', "Your first session is a relaxed conversation about what's brought you in, what you'd like to work on, and how we can support you. Nothing is rushed. You set the pace.")}
              ${this.faq('Are sessions confidential?', "Yes. Everything you share is held in strict confidence in line with BACP ethical guidelines. The only exceptions are safeguarding situations, which we'd always discuss with you first wherever possible.")}
              ${this.faq('Do you offer online sessions?', 'Yes - we offer both in-person sessions in Croydon and online sessions via Zoom or Skype. Many clients choose a mix of both.')}
              ${this.faq('Are your therapists qualified?', 'Our therapists are clinically trained psychotherapists working in line with BACP standards. The leadership team has 45+ years of combined clinical experience and over 50,000 clinical hours.')}
              ${this.faq('How can I support your work?', "You can donate via Localgiving or PayPal, volunteer your time, follow us on social media, or fundraise on our behalf. Get in touch and we'll match you to something that suits.")}
            </div>
          </div>
        </section>

        <section class="section reveal">
          <div class="container contact-grid">
            <div>
              <div class="section-label">Get in touch</div>
              <h2 class="section-title">We'd love to hear from you.</h2>
              <p class="section-subtitle">Email, WhatsApp, call or fill in the form. We aim to reply within two working days.</p>
              <ul class="contact-list">
                <li><strong>Email</strong><a href="mailto:info@floatingcounselling.co.uk">info@floatingcounselling.co.uk</a></li>
                <li><strong>WhatsApp / Call</strong><a href="https://wa.me/447305882959" target="_blank" rel="noopener">+44 (0)7305 882959</a></li>
                <li><strong>Visit the Hub</strong><span>Woodside Baptist Church, Spring Lane, Croydon SE25 4SP</span></li>
              </ul>
            </div>
            <div class="contact-card">
              <form class="mini-form">
                <input name="name" placeholder="Your name" required>
                <input name="email" type="email" placeholder="Email" required>
                <select name="topic">
                  <option>Counselling enquiry</option>
                  <option>Impact Parenting</option>
                  <option>Community Hub / food support</option>
                  <option>Holiday school</option>
                  <option>Volunteering</option>
                  <option>Something else</option>
                </select>
                <textarea name="message" placeholder="Message" required></textarea>
                <button class="btn btn-primary" type="submit">Send message</button>
              </form>
            </div>
          </div>
        </section>

        <section class="cta reveal">
          <div class="container">
            <div class="section-label">We're here</div>
            <h2>Whatever you're carrying, you don't carry it alone.</h2>
            <p>Whether you need counselling, community support, food, or just someone to talk to - reach out today. Your first step matters.</p>
            <div class="cta-actions">
              <a class="btn btn-white" href="mailto:info@floatingcounselling.co.uk">Email us</a>
              <a class="btn btn-glass" href="https://wa.me/447305882959" target="_blank" rel="noopener">WhatsApp us</a>
              <a class="btn btn-glass" href="https://www.paypal.com/donate?hosted_button_id=FLOATINGCOUNSELLING" target="_blank" rel="noopener">Donate via PayPal</a>
              <a class="btn btn-glass" href="http://www.localgiving.org/floatingcounselling" target="_blank" rel="noopener">Localgiving</a>
            </div>
          </div>
        </section>

        <footer class="footer">
          <div class="container footer-grid">
            <div>
              <img src="${asset('images/logo.png')}" alt="Floating Counselling">
              <p>Counselling, community and compassion - serving Croydon & London since 2015.</p>
            </div>
            <p>© ${year} Floating Counselling | BACP Member | ICO Registered | NHS SWL Partner</p>
          </div>
        </footer>
      </main>
    `;

    this.setupInteractions();
  }

  serviceCard(title, body, action) {
    return `
      <article class="service-card">
        <div class="service-icon">${this.icon()}</div>
        <h3>${title}</h3>
        <p>${body}</p>
        <a class="learn-more" href="mailto:info@floatingcounselling.co.uk?subject=${encodeURIComponent(title)}">${action} &rarr;</a>
      </article>
    `;
  }

  testimonial(initials, name, role, quote) {
    return `
      <article class="testimonial-card">
        <div class="quote">"</div>
        <p>${quote}</p>
        <div class="testimonial-author">
          <div class="avatar">${initials}</div>
          <div><h4>${name}</h4><span>${role}</span></div>
        </div>
      </article>
    `;
  }

  team(initials, name, role, email) {
    const emailLink = email ? `<a href="mailto:${email}">${email}</a>` : '';
    return `
      <article class="team-card">
        <div class="team-avatar">${initials}</div>
        <h4>${name}</h4>
        <p>${role}</p>
        ${emailLink}
      </article>
    `;
  }

  faq(question, answer) {
    return `<details class="faq-item"><summary>${question}</summary><p>${answer}</p></details>`;
  }

  icon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  setupInteractions() {
    const form = this.shadowRoot.querySelector('.mini-form');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const subject = encodeURIComponent(data.get('topic') || 'Floating Counselling enquiry');
        const body = encodeURIComponent([
          `Name: ${data.get('name') || ''}`,
          `Email: ${data.get('email') || ''}`,
          '',
          data.get('message') || ''
        ].join('\n'));
        window.location.href = `mailto:info@floatingcounselling.co.uk?subject=${subject}&body=${body}`;
      });
    }

    const revealItems = [...this.shadowRoot.querySelectorAll('.reveal')];
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealItems.forEach((item) => observer.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }
  }
}

if (!customElements.get('floating-home')) {
  customElements.define('floating-home', FloatingHome);
}
