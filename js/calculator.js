/* =========================
   JEWELLERY PRICE
========================= */

function calculatePrice() {
    const metal = document.getElementById('metal')?.value;
    const weight = Number(document.getElementById('weight')?.value);
    const makingPercent = Number(document.getElementById('makingCharge')?.value);
    const gstPercent = Number(document.getElementById('gst')?.value);
    const result = document.getElementById('finalPrice');

    if (!result) return;
    if (!Number.isFinite(weight) || weight <= 0 || makingPercent < 0 || gstPercent < 0) {
        result.textContent = 'Enter valid weight and charge percentages.';
        return;
    }

    const metalValue = getRatePerGram(metal) * weight;
    const makingValue = metalValue * makingPercent / 100;
    const gstValue = (metalValue + makingValue) * gstPercent / 100;
    const values = {
        metalValue: metalValue,
        makingValue: makingValue,
        gstValue: gstValue,
        finalPrice: metalValue + makingValue + gstValue
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = `₹${formatNumber(value.toFixed(2))}`;
    });
}


/* =========================
   OLD GOLD EXCHANGE
========================= */

function calculateExchange() {

    const weight =
        Number(document.getElementById("oldGoldWeight").value);

    const purity =
        Number(document.getElementById("oldGoldPurity").value);


    const result = document.getElementById('exchangeValue');
    if (!result) return;
    if (!Number.isFinite(weight) || weight <= 0) {
        result.textContent = 'Enter a valid weight.';
        return;
    }


    const pureGold =
        weight * purity / 24;


    const rate =
        rates.gold24 / 10;


    const value =
        pureGold * rate;


    const deductionPercent =
        Number(document.getElementById('exchangeDeduction')?.value ?? 5);


    const finalValue =
        value * (1 - deductionPercent / 100);

    result.textContent = `₹${formatNumber(finalValue.toFixed(2))}`;
}


/* =========================
   BUYBACK
========================= */

function calculateBuyback() {

    const weight =
        Number(document.getElementById("buybackWeight").value);

    const purity =
        Number(document.getElementById("buybackPurity").value);


    const result = document.getElementById('buybackResult');
    if (!result) return;
    if (!Number.isFinite(weight) || weight <= 0) {
        result.textContent = 'Enter a valid weight.';
        return;
    }


    const pureGold =
        weight * purity / 24;


    const rate =
        rates.gold24 / 10;


    const value =
        pureGold * rate;


    const deductionPercent =
        Number(document.getElementById('buybackDeduction')?.value ?? 3);


    const finalValue =
        value * (1 - deductionPercent / 100);

    result.textContent = `₹${formatNumber(finalValue.toFixed(2))}`;
}


/* =========================
   PURITY CONVERTER
========================= */

function convertPurity() {

    const weight =
        Number(document.getElementById("purityWeight").value);

    const from =
        Number(document.getElementById("fromPurity").value);

    const to =
        Number(document.getElementById("toPurity").value);


    if (!weight || weight <= 0 || !from || !to) {

        document.getElementById("purityResult").innerText =
            "Enter valid weight.";

        return;
    }


    const pureGold =
        weight * from / 24;


    const convertedWeight =
        pureGold * 24 / to;


    document.getElementById("purityResult").innerHTML = `

        <p>
        ${weight}g of ${from}K gold
        is approximately
        <strong>${convertedWeight.toFixed(2)}g</strong>
        of ${to}K gold.
        </p>

    `;
}