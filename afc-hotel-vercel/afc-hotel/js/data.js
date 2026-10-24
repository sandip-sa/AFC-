/* ============================================================
   AFC HOTEL — Data Layer (localStorage powered, real-time sync)
   ============================================================ */

const AFC_KEY = 'afc_db_v1';

const AFC_GROUPS = [
  { id: 'beverages', name: 'Beverages',            icon: '🍵' },
  { id: 'breakfast', name: 'Breakfast',            icon: '🍳' },
  { id: 'breads',    name: 'Breads & Roti',        icon: '🫓' },
  { id: 'mains',     name: 'Curries & Main Course',icon: '🍛' },
  { id: 'snacks',    name: 'Snacks & Starters',    icon: '🍢' },
  { id: 'grill',     name: 'Grill & Tandoor',      icon: '🔥' },
  { id: 'nepali',    name: 'Nepali & Tibetan',     icon: '🍜' },
  { id: 'bar',       name: 'Bar & Drinks',         icon: '🍷' },
];

/* category -> group mapping */
const AFC_CATGROUP = {
  'Tea & Coffee':'beverages','Cold Beverage':'beverages','Juice':'beverages','Mojito Refreshments':'beverages',
  'Breakfast':'breakfast',
  'Roti':'breads','Tandoor Roti Items':'breads','Naan Roti Items':'breads',
  'Non Veg Curry':'mains','Veg Curry':'mains','Thakali Set':'mains','Biryani':'mains',
  'Non-Veg Snacks':'snacks','Veg Snacks':'snacks','AFC Special Veg Items':'snacks','AFC Special Non-Veg Items':'snacks',
  'Pakoda':'snacks','Salad':'snacks','Spring Roll':'snacks','Kathi Rolls':'snacks','Sandwich':'snacks',
  'Burger':'snacks','Pizza':'snacks','Chopsy':'snacks','Khaja Set':'snacks','AFC Set Special':'snacks',
  'Sekuwa':'grill','Taas':'grill','Tandoor Items':'grill','Sizzler':'grill',
  'MoMo':'nepali','Chowmein':'nepali','Fried Rice':'nepali','Thukpa':'nepali','Soup':'nepali',
  'Domestic Spirit':'bar','Domestic Wine':'bar','Imported Liquors':'bar','Imported Wine':'bar','Beer':'bar','Smoking':'bar',
};

function m(id, name, cat, veg, price, extra) {
  return Object.assign({ id, name, cat, veg: !!veg, price: price ?? null, variants: null, available: true }, extra || {});
}
function v(id, name, cat, veg, variants, extra) {
  return Object.assign({ id, name, cat, veg: !!veg, price: null,
    variants: variants.map(p => ({ label: p[0], price: p[1] })), available: true }, extra || {});
}

function afcDefaultDB() {
  return {
    settings: {
      hotelName: 'AFC Hotel',
      tagline: 'Your Satisfaction is Our Goal',
      heroTitle: 'AFC Hotel & Restaurant',
      heroSubtitle: 'Authentic Nepali flavours, warm hospitality and comfortable stays in the heart of Golbazar, Siraha.',
      address: 'Golbazar-4, Siraha, Nepal, 56500',
      phone: '033-540487',
      email: 'shahparash07@gmail.com',
      facebook: 'https://www.facebook.com/afchotel',
      hours: 'Open Daily · 6:00 AM – 10:00 PM',
      about: 'Nestled in the heart of Golbazar, Siraha, AFC Hotel & Restaurant blends authentic Nepali hospitality with modern comfort. From sizzling sekuwa and hand-made momo to our signature Thakali sets, every dish is prepared fresh with love. Whether you are here for a family dinner, a comfortable night’s stay, or a celebration with friends — your satisfaction is our goal.',
      deliveryFee: 50,
      freeDeliveryAbove: 1000,
      currency: 'Rs.',
      notice: '',
    },
    auth: { username: 'admin', password: 'afc@123' },
    rooms: [
      { id: 'r1', name: 'Standard Room',       price: 1500, capacity: 2, available: true, desc: 'Cozy room with comfortable double bed, TV, attached bathroom and free Wi-Fi.' },
      { id: 'r2', name: 'Deluxe Double Room',  price: 2500, capacity: 2, available: true, desc: 'Spacious deluxe room with premium bedding, AC, TV, hot shower and complimentary breakfast.', popular: true },
      { id: 'r3', name: 'Family Suite',        price: 3500, capacity: 4, available: true, desc: 'Two-room suite perfect for families — king + twin beds, AC, seating area and room service.' },
    ],
    bookings: [],
    orders: [],
    catGroups: Object.assign({}, AFC_CATGROUP),
    menu: [
      /* ---------- TEA & COFFEE ---------- */
      v('m1','Tea','Tea & Coffee',true,[['Milk',50],['Black',40],['Lemon',35]]),
      v('m2','Coffee','Tea & Coffee',true,[['Milk',100],['Black',70]]),
      m('m3','Hot Milk','Tea & Coffee',true,100),
      m('m4','Hot Lemon','Tea & Coffee',true,150),
      m('m5','Hot Chocolate','Tea & Coffee',true,180),
      m('m6','Chocolate Milk Shake','Tea & Coffee',true,200),
      m('m7','Cold Coffee','Tea & Coffee',true,200),

      /* ---------- COLD BEVERAGE ---------- */
      m('m8','Cold Drinks','Cold Beverage',true,80),
      m('m9','Sweet Lassi','Cold Beverage',true,150),
      m('m10','Banana Lassi','Cold Beverage',true,200),
      m('m11','Soda Water','Cold Beverage',true,150),
      m('m12','Lemon Soda','Cold Beverage',true,150),
      m('m13','Mineral Water','Cold Beverage',true,35),
      m('m14','Mango Lassi','Cold Beverage',true,200),

      /* ---------- JUICE ---------- */
      v('m15','Fresh Juice','Juice',true,[['Orange',200],['Pineapple',200],['Mango',200],['Mix',200]]),
      m('m16','Badam Juice','Juice',true,180),
      m('m17','Blue Red Bull','Juice',true,380),
      m('m18','Red Bull','Juice',true,200),

      /* ---------- BREAKFAST ---------- */
      m('m19','Breakfast Set','Breakfast',false,250,{desc:'Butter toast, plain omelet & tea'}),
      m('m20','Puri Sabji','Breakfast',true,250,{desc:'With curd and pickle'}),
      m('m21','Aalu Pratha','Breakfast',true,200,{desc:'With curd and pickle'}),

      /* ---------- ROTI ---------- */
      m('m22','Tawa Roti','Roti',true,30),
      m('m23','Butter Roti','Roti',true,35),

      /* ---------- NON VEG CURRY ---------- */
      m('m24','Mutton Curry','Non Veg Curry',false,500,{popular:true,desc:'Slow-cooked Nepali style mutton curry'}),
      m('m25','Chicken Curry','Non Veg Curry',false,400),
      m('m26','Egg Curry','Non Veg Curry',false,280),
      m('m27','Fish Curry','Non Veg Curry',false,400),
      m('m28','Local Chicken Curry','Non Veg Curry',false,500,{desc:'Free-range local kukhura'}),

      /* ---------- VEG CURRY ---------- */
      m('m29','Mixed Veg','Veg Curry',true,300),
      m('m30','Mutter Paneer','Veg Curry',true,420),
      m('m31','Mushroom Paneer Masala','Veg Curry',true,420),
      m('m32','Paneer Butter Masala','Veg Curry',true,420,{popular:true}),
      m('m33','Mushroom Butter Masala','Veg Curry',true,420),
      m('m34','Paneer Do Pyaza','Veg Curry',true,450),
      m('m35','Aalu Mutter','Veg Curry',true,250),
      m('m36','Dal Tadka','Veg Curry',true,280),
      m('m37','Dal Fry','Veg Curry',true,250),

      /* ---------- THAKALI SET ---------- */
      m('m38','Local Kukhura Set','Thakali Set',false,550,{popular:true,desc:'Full Thakali dal-bhat with local chicken'}),
      m('m39','Mutton Set','Thakali Set',false,520),
      m('m40','Chicken Set','Thakali Set',false,420),
      m('m41','Veg Set','Thakali Set',true,280),
      m('m42','Fish Set','Thakali Set',false,480),

      /* ---------- BIRYANI ---------- */
      m('m43','Chicken Biryani','Biryani',false,420),
      m('m44','Mutton Biryani','Biryani',false,520),
      m('m45','Veg Biryani','Biryani',true,350),

      /* ---------- NON-VEG SNACKS ---------- */
      m('m46','Chicken Chilly B/L','Non-Veg Snacks',false,420),
      m('m47','Chicken Roast','Non-Veg Snacks',false,280),
      m('m48','Chicken Sadeko','Non-Veg Snacks',false,420),
      m('m49','Chicken Poleko','Non-Veg Snacks',false,350),
      m('m50','Chicken Chhoila','Non-Veg Snacks',false,450),
      m('m51','Chicken Fry','Non-Veg Snacks',false,380),
      m('m52','Chicken Drumstick','Non-Veg Snacks',false,450),
      m('m53','Chicken Sausage Fry','Non-Veg Snacks',false,350),
      m('m54','Chicken Wings','Non-Veg Snacks',false,400),
      m('m55','Chicken Meat Ball','Non-Veg Snacks',false,400),
      m('m56','Mutton Chilly','Non-Veg Snacks',false,600),
      m('m57','Mutton Fry','Non-Veg Snacks',false,500),
      m('m58','Mutton Meat Ball','Non-Veg Snacks',false,600),
      m('m59','Mutton Sadheko','Non-Veg Snacks',false,600),
      m('m60','Mutton Boil','Non-Veg Snacks',false,500),
      m('m61','Chicken Boil','Non-Veg Snacks',false,350),
      m('m62','Chicken Manchurian','Non-Veg Snacks',false,400),
      m('m63','Chicken Finger','Non-Veg Snacks',false,400),

      /* ---------- KATHI ROLLS ---------- */
      m('m64','Veg Kathi Roll','Kathi Rolls',true,180),
      m('m65','Mix Veg Kathi Roll','Kathi Rolls',true,240,{desc:'Paneer & mushroom'}),
      m('m66','Chicken Kathi Roll','Kathi Rolls',false,240),
      m('m67','Egg Kathi Roll','Kathi Rolls',false,220),
      m('m68','Mix Non-Veg Kathi Roll','Kathi Rolls',false,280,{desc:'Chicken & egg'}),

      /* ---------- SEKUWA ---------- */
      m('m69','Mutton Sekuwa Set','Sekuwa',false,650,{popular:true}),
      m('m70','Mutton Sekuwa','Sekuwa',false,500),
      m('m71','Chicken Sekuwa Set','Sekuwa',false,550),
      m('m72','Chicken Sekuwa','Sekuwa',false,400,{popular:true,desc:'Charcoal-grilled, house spices'}),

      /* ---------- AFC SPECIAL VEG ---------- */
      m('m73','Mix Veg Tempura','AFC Special Veg Items',true,400),
      m('m74','Paneer Saslik','AFC Special Veg Items',true,480),
      m('m75','Paneer Taas','AFC Special Veg Items',true,420),
      m('m76','Veg 99','AFC Special Veg Items',true,380),
      m('m77','Paneer/Mushroom (AFC Style)','AFC Special Veg Items',true,480),
      m('m78','Potato Wedges','AFC Special Veg Items',true,250),
      m('m79','Potato Ball','AFC Special Veg Items',true,250),
      m('m80','Onion Ring','AFC Special Veg Items',true,250),
      m('m81','Kaju Sadheko','AFC Special Veg Items',true,500),
      m('m82','Sweet Corn Pakoda','AFC Special Veg Items',true,380),
      m('m83','Crispy Sweet Corn','AFC Special Veg Items',true,350),
      m('m84','Veg Kagzi','AFC Special Veg Items',true,250),

      /* ---------- AFC SPECIAL NON-VEG ---------- */
      m('m85','Chicken Saslik','AFC Special Non-Veg Items',false,520),
      m('m86','Chicken Saathe','AFC Special Non-Veg Items',false,450),
      m('m87','Mutton Saslik','AFC Special Non-Veg Items',false,700),
      v('m88','Kalejo','AFC Special Non-Veg Items',false,[['Fry',500],['Boil',500],['Poleko',500]]),
      m('m89','Chicken 65','AFC Special Non-Veg Items',false,450,{popular:true}),
      m('m90','Thai Wings Chilly (3 pc)','AFC Special Non-Veg Items',false,450),
      m('m91','AFC Special Bhutan','AFC Special Non-Veg Items',false,350),
      m('m92','AFC Whole Fish Fry','AFC Special Non-Veg Items',false,480),
      m('m93','Chicken Crispy with Honey','AFC Special Non-Veg Items',false,450),
      m('m94','Local Kukhura Sadheko/Choila (W/B)','AFC Special Non-Veg Items',false,550),
      m('m95','Chicken Dragon','AFC Special Non-Veg Items',false,400),
      m('m96','Pangra Fry','AFC Special Non-Veg Items',false,400),
      m('m97','Mutton Meat Ball (AFC Special)','AFC Special Non-Veg Items',false,550),

      /* ---------- TANDOOR ---------- */
      m('m98','Paneer Tikka','Tandoor Items',true,550),
      m('m99','Mushroom Tikka','Tandoor Items',true,550),
      m('m100','Chicken Tandoori Full (4 pc)','Tandoor Items',false,1200,{popular:true}),
      m('m101','Chicken Tandoori Half (2 pc)','Tandoor Items',false,600),

      /* ---------- TANDOOR ROTI ---------- */
      m('m102','Tandoori Roti Plain','Tandoor Roti Items',true,40),
      m('m103','Tandoori Roti Butter','Tandoor Roti Items',true,50),

      /* ---------- NAAN ---------- */
      m('m104','Plain Naan','Naan Roti Items',true,90),
      m('m105','Butter Naan','Naan Roti Items',true,100),
      m('m106','Garlic Naan','Naan Roti Items',true,110),
      m('m107','Aaloo Naan','Naan Roti Items',true,120),
      m('m108','Keema Naan','Naan Roti Items',false,180),
      m('m109','Paneer Naan','Naan Roti Items',true,180),
      m('m110','Cheese Naan','Naan Roti Items',true,180),

      /* ---------- PIZZA ---------- */
      m('m111','Mix Pizza','Pizza',false,550),
      m('m112','Mutton Pizza','Pizza',false,550),
      m('m113','Chicken Pizza','Pizza',false,480),
      m('m114','Cheese Pizza','Pizza',true,450),
      m('m115','Mushroom Pizza','Pizza',true,450),
      m('m116','Veg Pizza','Pizza',true,420),

      /* ---------- BURGER ---------- */
      m('m117','Chicken Burger','Burger',false,220,{desc:'With french fries'}),
      m('m118','Cheese Burger','Burger',true,250,{desc:'With french fries'}),
      m('m119','Veg Burger','Burger',true,180,{desc:'With french fries'}),

      /* ---------- SPRING ROLL ---------- */
      m('m120','Chicken Spring Roll','Spring Roll',false,350),
      m('m121','Mix Non-Veg Spring Roll','Spring Roll',false,420),
      m('m122','Veg Spring Roll','Spring Roll',true,290),
      m('m123','Mix Veg Spring Roll','Spring Roll',true,350),

      /* ---------- CHOPSY ---------- */
      m('m124','American Chopsy','Chopsy',false,420),
      m('m125','Chinese Chopsy','Chopsy',false,380),
      m('m126','Veg Chopsy','Chopsy',true,320),

      /* ---------- SALAD ---------- */
      m('m127','Green Salad','Salad',true,150),
      m('m128','Nepali Salad','Salad',true,150),
      m('m129','Fruit Salad','Salad',true,300),
      m('m130','Russian Salad','Salad',true,320),

      /* ---------- KHAJA SET ---------- */
      m('m131','Chicken Khaja Set','Khaja Set',false,500),
      m('m132','Mutton Khaja Set','Khaja Set',false,600),
      m('m133','Veg Khaja Set','Khaja Set',true,400),

      /* ---------- VEG SNACKS ---------- */
      m('m134','Veg Nasta Set','Veg Snacks',true,150),
      m('m135','Mushroom Chilly','Veg Snacks',true,420),
      m('m136','Finger Chips','Veg Snacks',true,280),
      m('m137','Chips Chilly','Veg Snacks',true,420),
      m('m138','Paneer Chilly','Veg Snacks',true,500,{popular:true}),
      m('m139','Kajoo Fry','Veg Snacks',true,250),
      m('m140','Bhatmas Sadeko','Veg Snacks',true,250),
      m('m141','Papad Masala','Veg Snacks',true,95),
      m('m142','Papad Dry','Veg Snacks',true,110),
      m('m143','Papad Fry','Veg Snacks',true,250),
      m('m144','Prawn Fry','Veg Snacks',false,250),
      m('m145','Peanuts Sadheko','Veg Snacks',true,220),
      m('m146','Alu Sadheko','Veg Snacks',true,250),
      m('m147','Alu Jeera','Veg Snacks',true,220),
      m('m148','Alu Chop','Veg Snacks',true,250),
      m('m149','Veg Manchurian','Veg Snacks',true,150),
      m('m150','Vatmas Chiura Sadheko','Veg Snacks',true,220),
      m('m151','Veg Cutlet','Veg Snacks',true,380),
      m('m152','Sweet Corn Chilly','Veg Snacks',true,350),
      m('m153','Sweet Corn Sadheko','Veg Snacks',true,350),

      /* ---------- PAKODA ---------- */
      m('m154','Veg Pakoda','Pakoda',true,280),
      m('m155','Paneer Pakoda','Pakoda',true,420),
      m('m156','Mushroom Pakoda','Pakoda',true,420),
      m('m157','Onion Pakoda','Pakoda',true,300),
      m('m158','Cheese Pakoda','Pakoda',true,450),
      m('m159','Chicken Pakoda','Pakoda',false,450),

      /* ---------- AFC SET SPECIAL ---------- */
      m('m160','AFC Special Set','AFC Set Special',false,1000,{popular:true,desc:'Chicken drumstick, bhuja, sausage, chicken chilly, chicken fry, kaju fry, green salad, peanuts, prawn fry with french fry'}),

      /* ---------- SANDWICH ---------- */
      m('m161','Chicken Sandwich','Sandwich',false,250),
      m('m162','Cheese Sandwich','Sandwich',true,250),
      m('m163','Veg Sandwich','Sandwich',true,200),
      m('m164','Veg Cheese Sandwich','Sandwich',true,250),
      m('m165','Egg Sandwich','Sandwich',false,250),

      /* ---------- MOMO ---------- */
      m('m166','Chicken Kothe Momo','MoMo',false,240),
      m('m167','Veg Kothe Momo','MoMo',true,200),
      v('m168','Chicken Momo','MoMo',false,[['Steam',200],['Fried',220],['Chilli',280]],{popular:true}),
      v('m169','Veg Momo','MoMo',true,[['Steam',150],['Fried',170],['Chilli',220]],{popular:true}),
      m('m170','Veg Jhol Momo','MoMo',true,250),
      m('m171','Paneer Momo','MoMo',true,280),
      m('m172','Chicken Jhol Momo','MoMo',false,280),
      m('m173','Chicken C. Momo','MoMo',false,280),
      m('m174','Veg Momo Sadheko','MoMo',true,250),
      m('m175','Chicken Momo Sadheko','MoMo',false,280),
      m('m176','Veg Crispy Momo','MoMo',true,250),
      m('m177','Chicken Crispy Momo','MoMo',false,280),

      /* ---------- CHOWMEIN ---------- */
      m('m178','Chicken Chowmein','Chowmein',false,240),
      m('m179','Mutton Chowmein','Chowmein',false,380),
      m('m180','Egg Chowmein','Chowmein',false,220),
      m('m181','Veg Chowmein','Chowmein',true,160),
      m('m182','Mix Veg Chowmein','Chowmein',true,300),
      m('m183','Mix Non-Veg Chowmein','Chowmein',false,380),

      /* ---------- FRIED RICE ---------- */
      m('m184','Egg Fried Rice','Fried Rice',false,300),
      m('m185','Chicken Fried Rice','Fried Rice',false,330),
      m('m186','Veg Fried Rice','Fried Rice',true,250),
      m('m187','Mix Veg Fried Rice','Fried Rice',true,350),
      m('m188','Mix Non-Veg Fried Rice','Fried Rice',false,400),

      /* ---------- TAAS ---------- */
      m('m189','Mutton Taas Set','Taas',false,680),
      m('m190','Mutton Taas','Taas',false,520),
      m('m191','Chicken Taas Set','Taas',false,580),
      m('m192','Chicken Taas','Taas',false,420,{popular:true,desc:'Chitwan-style spicy taas'}),

      /* ---------- SOUP ---------- */
      m('m193','Chicken Soup','Soup',false,250),
      m('m194','Mushroom Soup','Soup',true,250),
      m('m195','Mixed Soup','Soup',false,280),
      m('m196','Veg Soup','Soup',true,180),
      m('m197','Hot & Sour Soup','Soup',false,200),
      m('m198','Chicken Mushroom Soup','Soup',false,250),
      m('m199','Chicken Clear Soup','Soup',false,220),

      /* ---------- THUKPA ---------- */
      m('m200','Chicken Thukpa','Thukpa',false,300),
      m('m201','Mutton Thukpa','Thukpa',false,400),
      m('m202','Mixed Thukpa','Thukpa',false,450),
      m('m203','Egg Thukpa','Thukpa',false,280),
      m('m204','Veg Thukpa','Thukpa',true,250),

      /* ---------- SIZZLER ---------- */
      m('m205','Mutton Sizzler','Sizzler',false,700),
      m('m206','Chicken Sizzler','Sizzler',false,600,{popular:true}),
      m('m207','Veg Sizzler','Sizzler',true,450),

      /* ---------- DOMESTIC SPIRIT (60/90/180/375/750 ml) ---------- */
      v('m208','Signature Red','Domestic Spirit',false,[['60 ml',300],['90 ml',450],['180 ml',900],['375 ml',1800],['750 ml',3600]]),
      v('m209','8848 Vodka','Domestic Spirit',false,[['60 ml',300],['90 ml',400],['180 ml',800],['375 ml',1600],['750 ml',3200]]),
      v('m210','Old Dubar','Domestic Spirit',false,[['60 ml',400],['90 ml',600],['180 ml',1100],['375 ml',2200],['750 ml',4400]]),
      v('m211','Black Chimney','Domestic Spirit',false,[['60 ml',450],['90 ml',650],['180 ml',1300],['375 ml',2600],['750 ml',5200]]),
      v('m212','Khukuri Rum','Domestic Spirit',false,[['60 ml',300],['90 ml',400],['180 ml',800],['375 ml',1600],['750 ml',3200]]),

      /* ---------- DOMESTIC WINE ---------- */
      v('m213','Big Master','Domestic Wine',false,[['Red',1200],['White',1200]]),
      m('m214','Big Master Premium','Domestic Wine',false,1800),

      /* ---------- MOJITO ---------- */
      m('m215','Green Mint Mojito','Mojito Refreshments',true,280),
      m('m216','Mint Mojito','Mojito Refreshments',true,280),
      m('m217','Hazelnut Mojito','Mojito Refreshments',true,280),
      m('m218','Blue Lagoon Mojito','Mojito Refreshments',true,280),
      v('m219','Strawberry/Pomegranate Mojito','Mojito Refreshments',true,[['Strawberry',280],['Pomegranate',280]]),
      m('m220','Vanilla Mojito','Mojito Refreshments',true,280),

      /* ---------- SMOKING ---------- */
      v('m221','Hookah (Large)','Smoking',false,[['Double Apple',600],['Mint',600],['Pan Flavoured',600],['Vanilla',600]]),
      m('m222','Surya Cigarette','Smoking',false,30),
      m('m223','Shikhar Ice','Smoking',false,25),

      /* ---------- BEER ---------- */
      m('m224','Carlsberg','Beer',false,650),
      m('m225','Tuborg Gold','Beer',false,550),
      m('m226','Tuborg Can (500 ml)','Beer',false,500),
      m('m227','Tuborg (330 ml)','Beer',false,280),
      m('m228','Gorkha (330 ml)','Beer',false,280),
      m('m229','Gorkha Strong','Beer',false,500),

      /* ---------- IMPORTED LIQUORS (60/90/180/375/750 ml) ---------- */
      v('m230','J.W Blue Label','Imported Liquors',false,[['60 ml',8000],['90 ml',11500],['180 ml',23000],['375 ml',46000],['750 ml',92000]]),
      v('m231','J.W Platinum Label','Imported Liquors',false,[['60 ml',3000],['90 ml',4500],['180 ml',9000],['375 ml',18000],['750 ml',36000]]),
      v('m232','J.W Gold Label','Imported Liquors',false,[['60 ml',2300],['90 ml',3500],['180 ml',6500],['375 ml',13000],['750 ml',25000]]),
      v('m233','J.W Green Label','Imported Liquors',false,[['60 ml',2000],['90 ml',3000],['180 ml',6000],['375 ml',12000],['750 ml',23000]]),
      v('m234','J.W Double Black Label','Imported Liquors',false,[['60 ml',1165],['90 ml',1750],['180 ml',3500],['375 ml',7000],['750 ml',14000]]),
      v('m235','J.W Black Label','Imported Liquors',false,[['60 ml',1000],['90 ml',1500],['180 ml',3000],['375 ml',6000],['750 ml',12000]]),
      v('m236','J.W Red Label','Imported Liquors',false,[['60 ml',900],['90 ml',1250],['180 ml',2500],['375 ml',5000],['750 ml',10000]]),
      v('m237','VAT 69 Scotch','Imported Liquors',false,[['60 ml',900],['90 ml',1250],['180 ml',2500],['375 ml',5000],['750 ml',10000]]),
      v('m238',"Teacher's Scotch",'Imported Liquors',false,[['60 ml',900],['90 ml',1250],['180 ml',2500],['375 ml',5000],['750 ml',10000]]),
      v('m239','Chivas Regal','Imported Liquors',false,[['60 ml',1100],['90 ml',1600],['180 ml',3200],['375 ml',6500],['750 ml',13000]]),
      v('m240','Absolute Vodka','Imported Liquors',false,[['60 ml',900],['90 ml',1250],['180 ml',2500],['375 ml',5000],['750 ml',10000]]),
      v('m241',"Jack Daniel's (J.D)",'Imported Liquors',false,[['60 ml',1100],['90 ml',1600],['180 ml',3200],['375 ml',6500],['750 ml',13000]]),
      v('m242','Sauza Taquila','Imported Liquors',false,[['60 ml',900],['90 ml',1250],['180 ml',2500],['375 ml',5000],['750 ml',10000]]),

      /* ---------- IMPORTED WINE ---------- */
      v('m243','J.P Canet','Imported Wine',false,[['Red',400],['White',400]]),
      v('m244','Robertson','Imported Wine',false,[['Red',350],['White',350]]),
      v('m245','Marques del Trion','Imported Wine',false,[['Red',350],['White',350]]),
      m('m246','Other Wines','Imported Wine',false,300),
    ],
  };
}

/* ---------------- Store ---------------- */
const DB = {
  cache: null,
  load() {
    try {
      const raw = localStorage.getItem(AFC_KEY);
      if (raw) { this.cache = JSON.parse(raw); return this.cache; }
    } catch (e) { console.warn('DB load failed, reseeding', e); }
    this.cache = afcDefaultDB();
    this.save(false);
    return this.cache;
  },
  save(emit = true) {
    localStorage.setItem(AFC_KEY, JSON.stringify(this.cache));
    if (emit) window.dispatchEvent(new CustomEvent('afc:change'));
  },
  get() { return this.cache || this.load(); },
  update(fn) { fn(this.get()); this.save(); },
  reset() { this.cache = afcDefaultDB(); this.save(); },
};

/* helpers */
const fmtRs = n => 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
const uid = p => (p || 'ID') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function itemPrice(it, label) {
  if (it.variants && it.variants.length) {
    const f = it.variants.find(x => x.label === label) || it.variants[0];
    return f.price;
  }
  return it.price || 0;
}
function groupOf(db, cat) { return (db.catGroups && db.catGroups[cat]) || 'snacks'; }
function todayStr(ts) { return new Date(ts).toDateString(); }
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
