const nodemailer = require("nodemailer");
const amqp = require("amqplib");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "johan98@ethereal.email",
    pass: "ZthnM2tFTMZgu8mt4R",
  },
});

async function main() {
  const amqpServer = "amqp://guest:guest@rabbitmq:5672"
  const connection = await amqp.connect(amqpServer)

  // PARTIE SEANCES
  console.log("En attente des messages de nouvelles séances...")
  const channel = await connection.createChannel();
  await channel.assertQueue("seance-queue");
  
  await channel.consume("seance-queue", async message => {
      const content = JSON.parse(message.content.toString());            
      console.log(`Recieved message with client email : ${content.email}`);
      await transporter.sendMail({
        from: 'cinema-ynov@master1.com',
        to: content.email,
        subject: "Une nouvelle séance est désormais disponible",
        html: "<h1>Nouvelle séance pour le film" + content.movie + " :</h1> <p>Une nouvelle séance est désormais disponible pour le film " + content.movie + " à : " + content.dateSeance + " !</p>",
      });

      // Vider la mémoire de rabbitmq
      channel.ack(message);      
  })

  // PARTIE RESERVATION
  console.log("En attente des message de reservation....")
  
  const reservation = await connection.createChannel();
  await reservation.assertQueue("reservation-queue");
  
  await reservation.consume("reservation-queue", async message => {
      const content = JSON.parse(message.content.toString());            
      console.log(`Recieved message with client email for reservation : ${content.email}`);
      await transporter.sendMail({
        from: 'cinema-ynov@master1.com',
        to: content.email,
        subject: "Réservation pour une séance",
        html: "<h1>Merci pour votre réservation de film :</h1> <p>Vous avez bien reservé votre film avec " + content.seats + " siège(s). Bon film!</p>",
      });

      // Vider la mémoire de rabbitmq
      reservation.ack(message);      
  })
}

main().catch(console.error);